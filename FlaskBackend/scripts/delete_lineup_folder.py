import os
import requests
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

def delete_lineup_folder(folder_id):
    logging.info(f"Starting delete process for lineup folder ID: {folder_id}")
    url_path = get_url() + "/lineups/folders/" + folder_id
    headers = {"accept": "application/json", "CustomToken": get_token()}
    params = {"forceDeleteChildren": 1}

    logging.info("Sending DELETE request to URL: %s with params: %s", url_path, params)

    try:
        response = requests.delete(url=url_path, params=params, headers=headers, verify="cert2.pem")

        if response.status_code == 204:
            logging.info("Successfully deleted the lineup folder")
            return {"status": "success", "message": "Lineup folder deleted successfully"}

        elif response.status_code == 401:
            logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
            generate_token()
            return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}

        elif response.status_code == 409:
            logging.error(
            "Deletion failed. Status: %d. Reason: %s. Folder has a child which is currently active or "
            "permission is required to forcefully delete children.",
            response.status_code,
            response.reason
             )
            return {"status": "failure", "errorMessage": "Deletion failed. Reason: " + response.reason}

        elif response.status_code == 404:
            logging.error("Folder not found.")
            return {"status": "failure", "errorMessage": "Folder not found"}, 404

        else:
            logging.error("Delete Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
            return {"status": "failure", "errorMessage": "Delete Request failed. Reason: " + response.reason}, response.status_code

    except requests.RequestException as e:
        logging.error(f"Request Exception: {str(e)}")
        return {"status": "failure", "errorMessage": f"Request exception: {str(e)}"}, 500

logging.info("Finished the delete lineup folders process.")
