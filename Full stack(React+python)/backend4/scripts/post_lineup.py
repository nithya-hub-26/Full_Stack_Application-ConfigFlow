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

LINEUP_JSON_FILE = "post_lineup.json"


def post_lineup(lineup_name, folder_id):
    lineup_url = get_url() + "/lineups"
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "CustomToken": get_token()
    }

    # Load the existing JSON data
    with open(LINEUP_JSON_FILE, "r") as file:
        data = json.load(file)

    # Update only the "name" field in the JSON
    data["name"] = lineup_name
    data["parentFolderId"] = folder_id

    logging.info("Sending POST request to URL: %s", lineup_url)

    lineup_response = requests.post(url=lineup_url, json=data, headers=headers, verify=get_verify())
    print(lineup_response)
    if lineup_response.status_code == 201:
        lineup_id = lineup_response.json().get("id")
        logging.info(f"Lineup created with ID: {lineup_id}")
        return {"status": "success", "lineupId": lineup_id}
    elif lineup_response.status_code == 401:
        logging.warning("Unauthorized when posting lineup. Regenerating token.")
        generate_token()
        return {"status": "failure", "errorMessage": "Unauthorized. Token expired."}
    else:
        logging.error(f"Lineup creation failed: {lineup_response.status_code} - {lineup_response.text}")
        return {"status": "failure", "errorMessage": lineup_response.reason}
