import os
import requests
import json
import logging
from datetime import datetime
from flask import request
from scripts.post_custoken import generate_token
from scripts.vsm_utils import *

LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("vsm_logs_%Y-%m-%d_%H-%M-%S.log"))
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)

def delete_pool(pool_id):
    logging.info(f"Starting delete process for pool ID: {pool_id}")
    url_path = get_url() + f"/pools/{pool_id}"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }

    try:
        response = requests.delete(url=url_path, headers=headers, verify="cert2.pem")

        if response.status_code == 204:
            logging.info("Pool deleted successfully.")
            return {"status": "success", "message": "Pool deleted successfully"}

        elif response.status_code == 401:
            logging.warning("Unauthorized access. Regenerating token...")
            generate_token()
            return {"status": "failure", "errorMessage": "Unauthorized access. Token regenerated."}

        elif response.status_code == 404:
            logging.error("Pool not found.")
            return {"status": "failure", "errorMessage": "Pool not found"}, 404

        else:
            logging.error(f"Failed to delete pool. Status: {response.status_code}, Reason: {response.reason}")
            return {"status": "failure", "errorMessage": f"Deletion failed. Reason: {response.reason}"}, response.status_code

    except requests.RequestException as e:
        logging.error(f"Request Exception: {str(e)}")
        return {"status": "failure", "errorMessage": f"Request exception: {str(e)}"}, 500

logging.info("Finished the delete pool process.")
