import os
import requests
import json
import logging
from datetime import datetime
from flask import request
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

def put_lineup_config(configId):
    logging.info("Starting the put_lineup_config process.")
    url_path = get_url() + f"/configs/{configId}"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }
    try:
        # Get updated request from the frontend request
        updated_config = request.json

        if not updated_config:
            logging.error("No request data received.")
            return {"status": "failure", "errorMessage": "No data provided"}, 400

        # Update the timestamp in `configDescription`
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        updated_config["configDescription"] = f"Updated at {timestamp}"

    except Exception as e:
        logging.error("Error processing request data: %s", str(e))
        return {"status": "failure", "errorMessage": str(e)}, 500

    logging.info("Sending PUT request to URL: %s", url_path)

    response = requests.put(url=url_path, json=updated_config, headers=headers, verify="cert2.pem")

    if response.status_code == 200:
        logging.info("Successfully updated the lineup config .")
        return {"status": "success", "message": "Lineup config is updated successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    elif response.status_code == 404:
        logging.error("Lineup config not found. Status: %d.", response.status_code)
        return {"status": "failure", "errorMessage": "Lineup config not found."}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Update Request failed. Reason: " + response.reason}

logging.info("Finished the put_lineup_config process.")
