import os
import requests
import json
import logging
import copy
from datetime import datetime
from flask import request

from scripts.post_activate_configs import activate_bulk_configs
from scripts.post_custoken import generate_token
from scripts.post_lineup import post_lineup
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

destination_folder_id = "03fa8d03-f485-4a84-ae43-39b29b9623c4"
templates_folder_id = "46b394ca-69f2-4a1e-b57d-890113943bc5"

def append_activate_ids(activate_ids):
    file_path = 'stored_activate_ids.json'

    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = []
    else:
        data = []

    source_id = template_id = destination_id = None

    if len(activate_ids) == 3:
        source_id, template_id, destination_id = activate_ids
    elif len(activate_ids) == 2:
        source_id, destination_id = activate_ids
        template_id = None

    if source_id and destination_id:
        new_entry = {
            "sourceId": source_id,
            "templateId": template_id,
            "destinationId": destination_id
        }

        data.append(new_entry)

        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)

def post_destination():
    logging.info("Starting the post_destination process.")

    new_destination = request.json
    new_lineup_name = new_destination.get("destinationName")
    resourceId = new_destination.get("resourceId")
    ingest_config_id = new_destination["source"].get("id")
    template = new_destination.get("template")
    template_config_id = "null"

    if not new_destination:
        logging.error("No request data received.")
        return {"status": "failure", "errorMessage": "No data provided"}, 400

    # Step 1: Create a lineup
    response = post_lineup(new_lineup_name, destination_folder_id)
    if response.get("status") == "success":
        lineup_id = response.get("lineupId")
    else:
        return response

    # Step 2: Post the Source config for the created lineup
    url_path = get_url() + f"/lineups/{lineup_id}/configs"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }
    try:
        print(new_destination)
        new_name = new_lineup_name
        ingest_type = new_destination["source"].get("ingestType")
        connection_str = new_destination["source"].get("connectionString")
        encry_set = new_destination["source"].get("encryptionSettings")
        latency = new_destination["source"].get("latency")

        if not (new_name and ingest_type and connection_str and encry_set and latency):
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
                "passphrase": "12345678901234"
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


    if template != "None":
        # Step 1: Create a lineup
        lineup_name = template.get("name")
        response = post_lineup(lineup_name, templates_folder_id)
        if response.get("status") == "success":
            temp_lineup_id = response.get("lineupId")
        else:
            return response

        # Step 2: Post the Source config for the created lineup
        temp_url_path = get_url() + f"/lineups/{temp_lineup_id}/configs"
        temp_data = copy.deepcopy(data)
        template_id = template.get("id")
        template_type = template.get("type")
        temp_data["name"] = lineup_name

        try:
            base_channel = {
                "xCodeType": "TRANSCODE",
                "id": "7480bb88-4262-40c1-8d1b-fa171b7ac2b9",
                "nameRef": "sam HD",
                "sourceId": "fe2ce481-f8bc-42f5-b099-7eae94abc0c1",
                "serviceBackup": {
                    "backupServices": []
                },
                "audioOnlyChannel": False,
                "scte35PidFilter": [],
                "videoDecodeSettings": {
                    "detailEnhancementCustom": 0,
                    "freezeFrameThreshold": 5000
                },
                "scte104Settings": {
                    "outputPidMode": "SINGLE_SCTE35_PID"
                },
                "passServiceNameFromInputSDTa": False
            }

            # Set the correct template ID key based on template type
            if template_type == 'linear':
                base_channel["xcodeTemplateId"] = template_id
            else:
                base_channel["audioTemplateId"] = template_id
                base_channel["audioOnlyChannel"] = True

            channel = {
                "channel": base_channel,
                "reservedRate": 0
            }

            temp_data["channels"].append(channel)

        except Exception as e:
            logging.error("Error processing template request data: %s", str(e))
            return {"status": "failure", "errorMessage": str(e)}, 500

        logging.info("Sending POST request to URL: %s", url_path)
        print("temp data:")
        print(temp_data)
        template_response = requests.post(url=temp_url_path, json=temp_data, headers=headers, verify=get_verify())
        print(template_response)
        if template_response.status_code == 201:
            template_config_id = template_response.json().get("id")
            logging.info(f"Template Config created with ID: {template_config_id}")
        elif template_response.status_code == 401:
            logging.warning("Unauthorized when posting lineup. Regenerating token.")
            generate_token()
            return {"status": "failure", "errorMessage": "Unauthorized. Token expired."}
        else:
            logging.error(f"Lineup creation failed: {template_response.status_code} - {template_response.text}")
            return {"status": "failure", "errorMessage": template_response.reason}


    logging.info("Sending POST request to URL: %s", url_path)
    print("data")
    print(data)

    response = requests.post(url=url_path, json=data, headers=headers, verify=get_verify())

    if response.status_code == 201:
        logging.info("Successfully created the destination .")
        egress_config_id = response.json().get("id")
        logging.info(f"Lineup config created with ID: {egress_config_id}")

        # Build activate json and activate the selected configs
        if template_config_id != "null":
            activate_ids = [
                ingest_config_id,
                template_config_id,
                egress_config_id
            ]
        else:
            activate_ids = [
                ingest_config_id,
                egress_config_id
            ]

        # Filter out None or empty
        activate_ids = [cfg_id for cfg_id in activate_ids if cfg_id]

        logging.info(f"Linking destination with source")

        response = activate_bulk_configs(activate_ids)
        if response["status"] == "success" and len(activate_ids) == 3:
            activate_ids[1] = template.get("name")

        # Save to file
        append_activate_ids(activate_ids)

        return {"status": "success", "message": "Destination is created successfully", "ids": activate_ids}
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

logging.info("Finished the post_destination process.")


