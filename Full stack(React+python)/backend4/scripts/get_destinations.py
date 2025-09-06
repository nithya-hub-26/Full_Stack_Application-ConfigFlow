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

parent_folder_id="03fa8d03-f485-4a84-ae43-39b29b9623c4"

def get_destinations():
    logging.info("Starting get_destination process.")

    base_url = get_url()
    token = get_token()
    verify = get_verify()
    params = {"activeOnly": 0}
    headers = {"accept": "application/json", "CustomToken": token}

    try:
        logging.info("GET /lineups request initiated.")
        response = requests.get(f"{base_url}/lineups", params=params, headers=headers, verify=verify)

        if response.status_code == 401:
            logging.warning("401 Unauthorized. Attempting to regenerate token.")
            generate_token()
            return {"status": "failure", "errorMessage": "Unauthorized. Token refreshed. Please retry."}

        response.raise_for_status()
        all_lineups = response.json()

        filtered_lineups = [
            l for l in all_lineups
            if l.get("parentFolderId") == parent_folder_id
        ]

        logging.info("%d lineups matched parentFolderId %s", len(filtered_lineups), parent_folder_id)

        merged_results = []

        # Delivery Region
        folders_res = requests.get(f"{base_url}/lineups/folders", headers=headers, verify=verify)
        if folders_res.status_code != 200:
            logging.warning("Failed to fetch ingest region")
        folder_list = folders_res.json()

        delivery_region = "Unknown"
        for folder in folder_list:
            if parent_folder_id == folder.get("id"):
                name = folder.get("name")
                delivery_region = name.split()[1]

        for lineup in filtered_lineups:
            lineup_id = lineup.get("lineupId")
            lineup_name = lineup.get("lineup")
            configs = lineup.get("configurations", [])

            if not configs:
                logging.warning("Skipping lineup %s (no configurations)", lineup_name)
                continue

            config = configs[0]

            config_id = config.get("configurationId")
            connection_status =  "Active" if config.get("configState") != "INACTIVE" else "Deactive"
            alarm_state = config.get("configAlarmState", {})
            alarm_status = alarm_state.get("highestPendingAlarmSeverity", "None")

            config_res = requests.get(f"{base_url}/configs/{config_id}", headers=headers, verify=verify)
            if config_res.status_code != 200:
                logging.warning("Failed to fetch configId %s", config_id)
                continue
            config = config_res.json()

            delivery_type = "Unknown"
            connection_string = ""
            resource_id = ""

            try:
               resource_id = config["allocationResource"]["id"]
               tlt = config["tltOutputs"][0]["outputTLTStream"]
               srt_output = tlt.get("srtOutput", {})

               # Ingest Type and Connection String
               mode = srt_output.get("mode", "")
               if mode == "Listener":
                   delivery_type = "SRT Listener"
                   reception_port = srt_output.get("receptionPort", "")
                   connection_string = f"0.0.0.0:{reception_port}" if reception_port else ""
               elif mode == "Caller":
                   delivery_type = "SRT Caller"
                   destination_ip = srt_output.get("destinationIP", "")
                   destination_port = srt_output.get("destinationUDP", "")
                   connection_string = f"{destination_ip}:{destination_port}" if destination_ip and destination_port else ""

            except (KeyError, IndexError, TypeError) as e:
                logging.warning("Could not extract tltOutputs from config %s: %s", config_id, str(e))

            merged = {
                "id": config_id,
                "name": lineup_name,
                "lineupId": lineup_id,
                "resourceId": resource_id,
                "cloudDeliveryRegion": delivery_region,
                "deliveryType": delivery_type,
                "address": connection_string,
                "connectionStatus": connection_status,
                "alarmStatus": alarm_status,
            }

            logging.info("Merged lineup: %s", json.dumps(merged, indent=2))
            merged_results.append(merged)

        logging.info("Completed processing. Total merged sources: %d", len(merged_results))
        return {"status": "success", "response": merged_results}

    except Exception as e:
        logging.error("Exception occurred: %s", str(e), exc_info=True)
        return {"status": "failure", "errorMessage": str(e)}

logging.info("Finished get_destinations script.")
