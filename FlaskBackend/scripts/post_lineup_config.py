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

CONFIG_JSON_FILE = "post_lineup_config.json"

def post_lineup_config(lineupId):
    logging.info("Starting the post_lineup_config process.")
    url_path = get_url() + f"/lineups/{lineupId}/configs"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }

    try:

        request_data = request.json
        new_name = request_data.get("name")
        source_name = request_data.get("sourceName")
        source_id = request_data.get("sourceId")
        idSrtGw = request_data.get("idSrtGw")
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        if not (new_name and source_name and idSrtGw and source_id):
            logging.error("Missing required fields: name, sourceName, or idSrtGw.")
            return {"status": "failure", "errorMessage": "Missing required fields"}, 400

        with open(CONFIG_JSON_FILE, "r") as file:
           data = json.load(file)

        data["name"] = new_name
        data["configDescription"] = data["configDescription"].replace("{{timestamp}}", timestamp)
        data["allocationResource"]["id"] = idSrtGw
        data["sources"][0]["source"]["id"] = source_id
        data["sources"][0]["source"]["name"] =  source_name
        data["tltOutputs"][0]["source"] = source_id


    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.error("Error reading or parsing the JSON file: %s", str(e))
        return {"status": "failure", "errorMessage": str(e)}, 500

    logging.info("Sending POST request to URL: %s", url_path)

    response = requests.post(url=url_path, json=data, headers=headers, verify="cert2.pem")

    if response.status_code == 201:
        logging.info("Request successful. Status: %d", response.status_code)
        return {"status": "success", "message": "Lineup config created successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": f"Post request failed: {response.reason}"}

logging.info("Finished the post_lineup_config process.")
