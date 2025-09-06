import os
import requests
import json
import logging
from datetime import datetime
from scripts.post_custoken import generate_token
from scripts.vsm_utils import *

# Create logs directory if it doesn't exist
LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# Generate log file name with current date and time
log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("vsm_logs_%Y-%m-%d_%H-%M-%S.log"))

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)

def get_pools():
    logging.info("Starting the get_pools process.")
    # Forming the request
    url_path = get_url() + "/pools"
    headers = {"accept": "application/json", "CustomToken": get_token()}

    logging.info("Sending GET request to URL: %s", url_path)

    # Sending the request
    response = requests.get(url=url_path, headers=headers, verify="cert2.pem")

    if response.status_code == 200:
        logging.info("Request successful. Response status: %d", response.status_code)
        json_data = response.json()
        logging.info("Response JSON: \n%s", json.dumps(json_data, indent=4))
        return {"status": "success", "response": json_data}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Request failed. Reason: " + response.reason}

logging.info("Finished the pools process.")
