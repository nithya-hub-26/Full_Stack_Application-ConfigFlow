import os
import requests
import logging
import json
from datetime import datetime
from post_custoken import generate_token
from vsm_utils import *

# Create logs directory if it doesn't exist
LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# Generate log file name with current date and time
log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("vsm_logs_%Y-%m-%d_%H-%M-%S.log"))

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)

def get_ResourceFromPool():
    poolId = "435550d4-6daa-42c7-b8c2-ebb7a772b015"
    url_path = get_url() + "/pools/" + poolId + "/resources"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token()
    }

    logging.info("Sending GET request to URL: %s", url_path)

    response = requests.get(url=url_path, headers=headers, verify="cert2.pem")

    if response.status_code == 200:
        logging.info("Request successful. Response status: %d", response.status_code)
        json_string = json.dumps(response.json(), indent=4)
        logging.info("Response JSON: \n%s", json_string)
        return {"status": "success", "message": "Resources from pool are listed successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Request failed. Reason: " + response.reason}

if __name__ == "__main__":
    logging.info("Starting the get_ResourceFromPool process.")
    result = get_ResourceFromPool()
    print(json.dumps(result)) # dumps from JSON obj to JSON str
    logging.info("Finished the get_ResourceFromPool process.")