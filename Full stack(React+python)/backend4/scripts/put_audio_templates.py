import os
import requests
import json
import logging
from datetime import datetime
from flask import request
from scripts.post_custoken import generate_token
from scripts.vsm_utils import *

LOGS_DIR = "logs"
os.makedirs(LOGS_DIR, exist_ok=True)

log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("vsm_logs_%Y-%m-%d_%H-%M-%S.log"))
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)

AUDIO_JSON_FILE = "audio_template.json"

def put_audio_templates(template_id):
    logging.info("Starting the put_audio_templates process for ID: %s", template_id)
    url_path = get_url() + f"/templates/audio-transcoding/{template_id}"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }

    try:
        request_data = request.json
        new_name = request_data.get("name")
        audio_codec = request_data.get("audioOutputCodec")
        bit_rate = request_data.get("bitrate")

        if not (new_name and audio_codec and bit_rate):
            logging.error("Missing required fields: name, audioDecodes, or audioEncodes.")
            return {"status": "failure", "errorMessage": "Missing required fields"}, 400

        with open(AUDIO_JSON_FILE, "r") as file:
            data = json.load(file)

        data["name"] = new_name
        data["audioEncodes"][0]["encodeType"] = audio_codec
        data["audioEncodes"][0]["bitrate"] = int(bit_rate)

    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.error("Error reading or parsing the JSON file: %s", str(e))
        return {"status": "failure", "errorMessage": str(e)}, 500

    logging.info("Sending PUT request to URL: %s", url_path)
    logging.info("Payload to be sent: %s", json.dumps(data, indent=2))

    response = requests.put(url=url_path, json=data, headers=headers, verify=get_verify())

    if response.status_code == 200:
        logging.info("Template updated successfully. Status: %d", response.status_code)
        return {"status": "success", "message": "Audio template updated successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized. Regenerating token.")
        generate_token()
        return {"status": "failure", "errorMessage": "Unauthorized. Token regenerated."}, 401
    else:
        logging.error("PUT request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": f"Put request failed: {response.reason}"}, response.status_code
