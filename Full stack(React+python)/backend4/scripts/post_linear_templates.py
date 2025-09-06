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

LINEAR_JSON_FILE = "linear_template.json"

def post_linear_templates():
    logging.info("Starting the post_linear_template process.")
    url_path = get_url() + "/templates/linear-transcoding"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }

    try:

        request_data = request.json
        new_name = request_data.get("name")
        video_codec = request_data.get("videoOutputCodec")
        hresolution = request_data.get("hResolution")
        vresolution = request_data.get("vResolution")
        frame_rate = request_data.get("frameRate")

        if not (new_name and video_codec and hresolution and vresolution and frame_rate):
            logging.error("Missing required fields: name, videoOutputCodec, resolution or frameRate.")
            return {"status": "failure", "errorMessage": "Missing required fields"}, 400

        with open(LINEAR_JSON_FILE, "r") as file:
           data = json.load(file)

        data["name"] = new_name
        data["videoEncodeSettings"]["codec"] = video_codec
        data["videoEncodeSettings"]["frameRate"] = frame_rate
        data["videoEncodeSettings"]["hResolution"] =  hresolution
        data["videoEncodeSettings"]["vResolution"] = vresolution


    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.error("Error reading or parsing the JSON file: %s", str(e))
        return {"status": "failure", "errorMessage": str(e)}, 500

    logging.info("Sending POST request to URL: %s", url_path)

    print(data)

    response = requests.post(url=url_path, json=data, headers=headers, verify=get_verify())

    if response.status_code == 201:
        logging.info("Request successful. Status: %d", response.status_code)
        return {"status": "success", "message": "Linear template created successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": f"Post request failed: {response.reason}"}

logging.info("Finished the post_linear_template process.")
