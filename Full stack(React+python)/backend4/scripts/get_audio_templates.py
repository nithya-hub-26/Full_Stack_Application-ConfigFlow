import os
import requests
import json
import logging
from datetime import datetime
from scripts.post_custoken import generate_token
from scripts.vsm_utils import *

# Setup logging
LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("vsm_logs_%Y-%m-%d_%H-%M-%S.log"))
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)


def get_audio_templates():
    logging.info("Starting get_audio_templates process.")

    base_url = get_url()
    token = get_token()
    verify = get_verify()
    params = {"includeUsage": False}
    headers = {"accept": "application/json", "CustomToken": token}

    try:
        logging.info("GET /templates request initiated.")
        response = requests.get(f"{base_url}/templates/audio-transcoding", params=params, headers=headers, verify=verify)

        if response.status_code == 200:
            logging.info(f"Response Status Code: {response.status_code}")
            details = response.json()

            audio_templates = []

            for item in details:
                name = item.get('name')
                id = item.get('id')
                audio_encode = item.get('audioEncodes', [{}])[0]

                audio_template = {
                    "id": id,
                    "type": "audio",
                    "name": name,
                    "audioOutputCodec": audio_encode.get('encodeType'),
                    "bitrate": audio_encode.get('bitrate')
                }

                audio_templates.append(audio_template)
                logging.info(f"Parameters received from VSM for the given audio is: {audio_template}")

            logging.info(f"Full audio template details: {audio_templates}")
            return {"status": "success", "response": audio_templates}

        elif response.status_code == 401:
            logging.warning("401 Unauthorized. Attempting to regenerate token.")
            generate_token()
            return {"status": "failure", "errorMessage": "Unauthorized. Token refreshed. Please retry."}
        else:
            logging.error(f"Failed to get audio templates. Status code: {response.status_code}")
            logging.error(f"Error response: {response.text}")
            return {"status": "failure", "errorMessage": "Get audio templates failed. Reason: " + response.reason}

    except Exception as e:
        logging.error("Exception occurred: %s", str(e), exc_info=True)
        return {"status": "failure", "errorMessage": str(e)}

logging.info("Finished get_audio_templates script.")

