import os
import requests
import json
import logging
from datetime import datetime
from flask import request

from scripts.get_sources import parent_folder_id
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

LINEUP_JSON_FILE = "post_lineup.json"
CONFIG_JSON_FILE = "post_source.json"

parent_folder_id = "0edaf9f5-6edc-412b-a22c-97d4a83dd9a5"

def post_source():
    logging.info("Starting the post_sources process.")

    # Step 1: Create a lineup
    lineup_url = get_url() + "/lineups"
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "CustomToken": get_token()
    }

    new_source = request.json
    new_lineup_name = new_source.get("name")

    if not new_source:
        logging.error("No request data received.")
        return {"status": "failure", "errorMessage": "No data provided"}, 400

    # Load the existing JSON data
    with open(LINEUP_JSON_FILE, "r") as file:
        data = json.load(file)

    # Update only the "name" field in the JSON
    data["name"] = new_lineup_name
    data["parentFolderId"] = parent_folder_id

    logging.info("Sending POST request to URL: %s", lineup_url)

    lineup_response = requests.post(url=lineup_url, json=data, headers=headers, verify=get_verify())
    print(lineup_response)
    if lineup_response.status_code == 201:
        lineup_id = lineup_response.json().get("id")
        logging.info(f"Lineup created with ID: {lineup_id}")
    elif lineup_response.status_code == 401:
        logging.warning("Unauthorized when posting lineup. Regenerating token.")
        generate_token()
        return {"status": "failure", "errorMessage": "Unauthorized. Token expired."}
    else:
        logging.error(f"Lineup creation failed: {lineup_response.status_code} - {lineup_response.text}")
        return {"status": "failure", "errorMessage": lineup_response.reason}

    # Step 2: Post the Source config for the created lineup
    url_path = get_url() + f"/lineups/{lineup_id}/configs"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }
    try:
        print(new_source)
        new_name = new_source.get("name")
        resourceId = new_source.get("resourceId")
        ingest_type = new_source.get("ingestType")
        connection_str = new_source.get("connectionString")
        encry_set = new_source.get("encryptionSettings")
        passphrase = new_source.get("passphrase")
        latency = new_source.get("latency")

        if not (new_name and resourceId and ingest_type and connection_str and encry_set and latency):
            logging.error("Missing required fields needed for the request")
            return {"status": "failure", "errorMessage": "Missing required fields"}, 400

        with open(CONFIG_JSON_FILE, "r") as file:
            data = json.load(file)

        ip, port = connection_str.split(":")
        port = int(port)

        srt_output = {
            "mode": "Caller" if ingest_type == "SRT Caller" else "Listener",
            "streamId": "",
            "bwOverhead": 25,
            "srtSecurityParams": {
                "keyLength": encry_set
            },
            "latency": latency,
            "anyInterface": False,
            "maxClients": 2
        }

        if encry_set != "Disabled":
            srt_security = {
                "keyLength": encry_set,
                "passphrase": passphrase
            }
            srt_output["srtSecurityParams"] = srt_security

        # Add Listener/Caller-specific fields
        if srt_output["mode"] == "Caller":
            srt_output["destinationIP"] = ip
            srt_output["destinationUDP"] = port
        else:
            srt_output["receptionPort"] = port

        data["name"] = new_name
        data["allocationResource"]["id"] = resourceId

        # Set IP source params
        ip_source = data["sources"][0]["source"].get("ipSourceParams", {})
        if srt_output["mode"] == "Caller":
            ip_source.pop("receptionPort", None)
        else:
            ip_source["receptionPort"] = port

        # Update tltOutputs
        tlt = data["tltOutputs"][0]["outputTLTStream"]
        tlt["srtOutput"] = srt_output

        # Update the timestamp in `configDescription`
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        data["configDescription"] = f"Updated at {timestamp}"

    except Exception as e:
        logging.error("Error processing request data: %s", str(e))
        return {"status": "failure", "errorMessage": str(e)}, 500

    logging.info("Sending POST request to URL: %s", url_path)
    print(data)

    response = requests.post(url=url_path, json=data, headers=headers, verify=get_verify())

    if response.status_code == 201:
        logging.info("Successfully created the source .")
        return {"status": "success", "message": "Source is created successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    elif response.status_code == 404:
        logging.error("Source not found. Status: %d.", response.status_code)
        return {"status": "failure", "errorMessage": "Source not found."}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Create Request failed. Reason: " + response.reason}

logging.info("Finished the post_sources process.")
