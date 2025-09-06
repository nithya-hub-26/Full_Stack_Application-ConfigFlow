import os
import requests
import json
import logging
from datetime import datetime
from scripts.vsm_utils import *
from scripts.post_custoken import generate_token

LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("vsm_logs_%Y-%m-%d_%H-%M-%S.log"))
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)


def activate_bulk_configs(config_ids):
    try:
        url = get_url() + "/configs/schedules/current/bulkrequest"
        headers = {
            "Content-Type": "application/json",
            "CustomToken": get_token()
        }

        payload = json.dumps({
            "activateConfigs": config_ids,
            "deactivateConfigs": []
        })

        logging.info(f"Sending bulk activate request for configs: {config_ids}")
        response = requests.post(url, headers=headers, data=payload, verify=get_verify())

        if response.status_code == 202:
            logging.info("Configs activated successfully.")
            return {"status": "success", "message": "Configs activated successfully."}
        elif response.status_code == 401:
            logging.warning("401 Unauthorized. Attempting to regenerate token.")
            generate_token()
            return {"status": "failure", "errorMessage": "Unauthorized. Token refreshed. Please retry."}
        else:
            logging.error(f"Activation failed: {response.status_code} - {response.text}")
            return {"status": "failure", "errorMessage": response.reason}

    except Exception as e:
        logging.exception("Exception occurred during bulk activation.")
        return {"status": "failure", "errorMessage": str(e)}
