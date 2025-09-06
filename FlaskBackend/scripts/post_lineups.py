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

LINEUP_JSON_FILE = "post_lineup.json"

def post_lineups():
    logging.info("Starting the post_lineups process.")
    url_path = get_url() + "/lineups"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }

    try:
        # Get new lineup name from the frontend request
        request_data = request.json
        new_lineup_name = request_data.get("name")
        parentFolderId = request_data.get("parentFolderId")
        lineup_type = request_data.get("type")

        if not new_lineup_name:
            return {"status": "failure", "errorMessage": "Missing lineup name"}, 400

        # Load the existing JSON data
        with open(LINEUP_JSON_FILE, "r") as file:
            data = json.load(file)

        # Update only the "name" field in the JSON
        data["name"] = new_lineup_name
        data["parentFolderId"] = parentFolderId
        data["type"] = lineup_type

    except FileNotFoundError:
        logging.error("The file post_lineup.json was not found.")
        return {"status": "failure", "errorMessage": "JSON file not found"}, 500
    except json.JSONDecodeError:
        logging.error("The file post_lineup.json contains invalid JSON.")
        return {"status": "failure", "errorMessage": "Invalid JSON format"}, 500

    logging.info("Sending POST request to URL: %s", url_path)

    response = requests.post(url=url_path, json=data, headers=headers, verify="cert2.pem")

    if response.status_code == 201:
        logging.info("Request successful. Response status: %d", response.status_code)
        json_string = json.dumps(response.json(), indent=4)
        logging.info("Response JSON: \n%s", json_string)
        return {"status": "success", "message": "Lineup is created successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Post Request failed. Reason: " + response.reason}

logging.info("Finished the post_lineups process.")
