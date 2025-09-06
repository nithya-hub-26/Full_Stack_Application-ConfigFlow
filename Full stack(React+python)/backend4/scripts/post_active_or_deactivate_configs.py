import os
import requests
import json
import logging
from datetime import datetime
from flask import request

from scripts.vsm_utils import *
from scripts.post_custoken import generate_token

LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("vsm_logs_%Y-%m-%d_%H-%M-%S.log"))
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)


def post_active_or_deactivate_configs(config_id):
    try:
        url = get_url() + "/configs/schedules/current/bulkrequest"
        headers = {
            "Content-Type": "application/json",
            "CustomToken": get_token()
        }

        request_data = request.json
        status = request_data.get("status")
        payload = ""

        if status == "Active":
            payload = json.dumps({
                "activateConfigs": [config_id],
                "deactivateConfigs": []
            })
        elif status == "Deactive":
            payload = json.dumps({
                "activateConfigs": [],
                "deactivateConfigs": [config_id]
            })

        logging.info(f"Sending a status change request for config: {config_id}")
        response = requests.post(url, headers=headers, data=payload, verify=get_verify())

        if response.status_code == 202:
            logging.info("Status has been changed successfully.")
            return {"status": "success", "message": "Status has been changed successfully."}
        elif response.status_code == 401:
            logging.warning("401 Unauthorized. Attempting to regenerate token.")
            generate_token()
            return {"status": "failure", "errorMessage": "Unauthorized. Token refreshed. Please retry."}
        else:
            logging.error(f"Status change failed: {response.status_code} - {response.text}")
            return {"status": "failure", "errorMessage": response.reason}

    except Exception as e:
        logging.exception("Exception occurred during status change request.")
        return {"status": "failure", "errorMessage": str(e)}
