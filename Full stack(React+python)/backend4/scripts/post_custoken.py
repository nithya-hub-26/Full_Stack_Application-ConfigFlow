import json
import os
import requests
import logging
from datetime import datetime
from scripts.vsm_utils import *

# Create logs directory if it doesn't exist
LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# Generate log file name with current date and time
log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("vsm_logs_%Y-%m-%d_%H-%M-%S.log"))

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)

def generate_token():
    url_path = get_url() + "/authenticate"
    headers = {"accept": "application/json", "Content-Type": "application/json"}
    data = {"username": "User", "password": "Administrator@123", "newPassword": "string"}

    logging.info("Sending POST request to URL: %s", url_path)

    response = requests.post(url=url_path, json=data, headers=headers, verify=get_verify())

    if response.status_code == 200:
        CustomToken = response.json().get('token')
        logging.info("New custom token generated successfully.")
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        token_path = os.path.join(BASE_DIR, '..', 'token.txt')

        with open(token_path, 'w') as file:
            file.write(CustomToken)
        logging.info("Custom token saved to token.txt.")
        return {"status": "success", "message": "New custom token generated successfully"}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Token generated failed"}

if __name__ == "__main__":
    logging.info("Starting the generate_token process.")
    result = generate_token()
    print(json.dumps(result))  # dumps from JSON obj to JSON str
    logging.info("Finished the generate_token process.")
