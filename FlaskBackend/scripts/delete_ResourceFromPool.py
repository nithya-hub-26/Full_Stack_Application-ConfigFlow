import json
import os
import requests
import logging
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

def delete_ResourceFromPool():
    poolId = "435550d4-6daa-42c7-b8c2-ebb7a772b015"
    resourceId = "8a299691-93b6-fcb3-0194-72eb08f375dd"
    url_path = get_url() + "/pools/" + poolId + "/resources/" + resourceId
    headers = {
        "accept": "application/json",
        "CustomToken": get_token()
    }

    logging.info("Sending DELETE request to URL: %s", url_path)

    response = requests.delete(url=url_path, headers=headers, verify="cert2.pem")

    if response.status_code == 200:
        logging.info("Successfully deleted the resource from the pool")
        return {"status": "success", "message": "Resource is deleted from the pool successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    elif response.status_code == 409:
        logging.error(
            "Deletion failed. Status: %d. Reason: %s. Folder has a child which is currently active or "
            "permission is required to forcefully delete children.",
            response.status_code,
            response.reason,
        )
        return {"status": "failure", "errorMessage": "Deletion failed. Reason: " + response.reason}
    elif response.status_code == 429:
        logging.error("Status: %d. Reason: Too many concurrent actions are being done on the Pool")
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Delete Request failed. Reason: " + response.reason}

if __name__ == "__main__":
    logging.info("Starting the delete_ResourceFromPool process.")
    result = delete_ResourceFromPool()
    print(json.dumps(result)) # dumps from JSON obj to JSON str
    logging.info("Finished the delete_ResourceFromPool process.")