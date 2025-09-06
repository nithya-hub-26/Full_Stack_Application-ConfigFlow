import json
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

def delete_linear_template(template_id):
    logging.info(f"Starting delete process for linear template ID: {template_id}")
    url_path = get_url() + f"/templates/linear-transcoding/{template_id}"
    headers = {"accept": "application/json", "CustomToken": get_token()}

    logging.info("Sending DELETE request to URL: %s", url_path)

    response = requests.delete(url=url_path, headers=headers, verify=get_verify())

    if response.status_code == 204:
        logging.info("Linear template deleted successfully")
        return {"status": "success", "message": "Linear template deleted successfully"}

    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    elif response.status_code == 400:
        logging.error("Deletion failed. Status: %d. Reason: %s. Invalid UUID provided.", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Deletion failed. Reason: " + response.reason}, response.status_code
    elif response.status_code == 409:
        logging.error(
            "Deletion failed. Status: %d. Reason: %s. This template is in use by another user.",
            response.status_code,
            response.reason
        )
        return {"status": "failure", "errorMessage": "Deletion failed. Reason: " + response.reason}
    else:
        logging.error("Delete Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Delete Request failed. Reason: " + response.reason}, response.status_code

logging.info("Finished the delete linear template process.")
