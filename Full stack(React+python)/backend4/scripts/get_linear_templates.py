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


def get_linear_templates():
    logging.info("Starting get_video_templates process.")

    base_url = get_url()
    token = get_token()
    verify = get_verify()
    params = {"includeUsage": False}
    headers = {"accept": "application/json", "CustomToken": token}

    try:
        logging.info("GET /templates request initiated.")
        response = requests.get(f"{base_url}/templates/linear-transcoding", params=params, headers=headers,
                                verify=verify)

        if response.status_code == 200:
            logging.info(f"Response Status Code: {response.status_code}")
            details = response.json()

            video_templates = []

            for item in details:
                id = item.get('id', 'null')
                name = item.get('name', 'null')
                type = "linear"

                video_settings = item.get('videoEncodeSettings', {})

                videoOutputCodec = video_settings.get('codec', 'null')
                hresolution = video_settings.get('hResolution', None)
                vresolution = video_settings.get('vResolution', None)
                frameRate = video_settings.get('frameRate', 'null')


                video_template = {
                    "id": id,
                    "name": name,
                    "type": type,
                    "videoOutputCodec": videoOutputCodec,
                    "hResolution": hresolution,
                    "vResolution": vresolution,
                    "frameRate": frameRate
                }

                video_templates.append(video_template)
                logging.info(f"parameters received from vsm for given video template: {video_templates}")

            logging.info(f"Full video template details: {video_templates}")
            return {"status": "success", "response": video_templates}

        elif response.status_code == 401:
            logging.warning("401 Unauthorized. Attempting to regenerate token.")
            generate_token()
            return {"status": "failure", "errorMessage": "Unauthorized. Token refreshed. Please retry."}

        else:
            logging.error(f"Failed to get linear templates. Status code: {response.status_code}")
            logging.error(f"Error response: {response.text}")
            return {"status": "failure", "errorMessage": "Get video templates failed. Reason: " + response.reason}


    except Exception as e:
        logging.error("Exception occurred: %s", str(e), exc_info=True)
        return {"status": "failure", "errorMessage": str(e)}


logging.info("Finished get_templates script.")

