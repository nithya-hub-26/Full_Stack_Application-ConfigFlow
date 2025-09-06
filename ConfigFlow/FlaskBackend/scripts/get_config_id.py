import os
import requests
import logging
import json
from datetime import datetime
from flask import Flask, jsonify
from scripts.post_custoken import generate_token
from scripts.vsm_utils import *

app = Flask(__name__)

# Create logs directory if it doesn't exist
LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# Generate log file name with current date and time
log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("vsm_logs_%Y-%m-%d_%H-%M-%S.log"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)

def get_config_id(configId):
    logging.info(f"Fetching configs for Config ID: {configId}")
    url_path = get_url() + f"/configs/{configId}"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }

    response = requests.get(url=url_path, headers=headers, verify="cert2.pem")

    if response.status_code == 200:
        logging.info("Request successful. Response status: %d", response.status_code)
        json_data = response.json()
        logging.info("Response JSON: \n%s", json.dumps(json_data, indent=4))
        return {"status": "success", "response": json_data}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
    elif response.status_code == 404:
        logging.error("Config not found.")
        return {"status": "failure", "errorMessage": "Config not found"}, 404
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)

logging.info("Finished the get lineup configs process.")
