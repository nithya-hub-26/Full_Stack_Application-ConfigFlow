import os
import requests
import json
import logging
from datetime import datetime
from flask import request
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

CONFIG_JSON_FILE = "put_source.json"

def put_sources(configId):
    logging.info("Starting the put_sources process.")
    url_path = get_url() + f"/configs/{configId}"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }
    try:
        # Get updated request from the frontend request
        updated_source = request.json
        print(updated_source)

        if not updated_source:
            logging.error("No request data received.")
            return {"status": "failure", "errorMessage": "No data provided"}, 400

        new_name = updated_source.get("name")
        source_id = updated_source.get("sourceId")
        resource_id = updated_source.get("resourceId")
        ingest_type = updated_source.get("ingestType")
        connection_str = updated_source.get("connectionString")
        encry_set = updated_source.get("encryptionSettings")
        passphrase = updated_source.get("passphrase")
        latency = updated_source.get("latency")

        if not (new_name and ingest_type and connection_str and encry_set and latency and source_id and resource_id):
            logging.error("Missing required fields needed for the request")
            return {"status": "failure", "errorMessage": "Missing required fields"}, 400

        if encry_set != "Disabled" and passphrase == None:
            logging.error("Passphrase is required for encryption")
            return {"status": "failure", "errorMessage": "Passphrase required for encryption"}, 400

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
        data["allocationResource"]["id"] = resource_id
        data["sources"][0]["source"]["id"] = source_id
        data["tltOutputs"][0]["source"] = source_id

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

    logging.info("Sending PUT request to URL: %s", url_path)
    print("datat before put config")
    print(data)

    response = requests.put(url=url_path, json=data, headers=headers, verify=get_verify())

    if response.status_code == 200:
        logging.info("Successfully updated the source .")
        return {"status": "success", "message": "Source is updated successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    elif response.status_code == 404:
        logging.error("Source not found. Status: %d.", response.status_code)
        return {"status": "failure", "errorMessage": "Source not found."}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Update Request failed. Reason: " + response.reason}

logging.info("Finished the put_sources process.")
