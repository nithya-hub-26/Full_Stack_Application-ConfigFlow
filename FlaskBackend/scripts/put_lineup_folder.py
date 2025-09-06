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

JSON_FILE = "post_folder.json"

def put_lineup_folder():
    logging.info("Starting the put_lineup_folder process.")
    try:
        # Get new folder name from the frontend request
        request_data = request.json

        folder_id = request_data.get("id")
        new_folder_name = request_data.get("name")

        if not folder_id or not new_folder_name:
            return {"status": "failure", "errorMessage": "Missing folder ID or name"}, 400

        url_path = get_url() + f"/lineups/folders/{folder_id}"
        headers = {
            "accept": "application/json",
            "CustomToken": get_token(),
            "Content-Type": "application/json"
        }

        # Load the existing JSON data
        with open(JSON_FILE, "r") as file:
            data = json.load(file)

        # Update only the "name" field in the JSON
        data["name"] = new_folder_name
        data["parentFolderId"] = request_data.get("parentFolderId")
        logging.info("Updated folder name: %s", new_folder_name)

    except FileNotFoundError:
        logging.error("The file post_folder.json was not found.")
        return {"status": "failure", "errorMessage": "JSON file not found"}, 500
    except json.JSONDecodeError:
        logging.error("The file post_folder.json contains invalid JSON.")
        return {"status": "failure", "errorMessage": "Invalid JSON format"}, 500

    logging.info("Sending PUT request to URL: %s", url_path)

    response = requests.put(url=url_path, json=data, headers=headers, verify="cert2.pem")

    if response.status_code == 204:
        logging.info("Successfully updated the folder name.")
        return {"status": "success", "message": "Folder name is updated successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    elif response.status_code == 404:
        logging.error("Folder not found. Status: %d.", response.status_code)
        return {"status": "failure", "errorMessage": "Folder not found."}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Update Request failed. Reason: " + response.reason}

logging.info("Finished the put_lineup_folders process.")
