import os
import logging
from flask import request
from datetime import datetime
from scripts.delete_lineup import delete_lineup
from scripts.delete_lineup_config import delete_lineup_config

# Create logs directory if not exists
LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# Log filename with timestamp
log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("delete_source_%Y-%m-%d_%H-%M-%S.log"))

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)

def delete_source_or_destination():
    data = request.json
    config_id = data.get("id")
    lineup_id = data.get("lineupId")

    if not config_id and lineup_id:
        return {"status": "failure", "errorMessage": "Missing configId or lineupId"}, 400

    logging.info(f"Starting delete process for Config ID: {config_id} and Lineup ID: {lineup_id}")

    # Step 1: Delete Config
    config_result = delete_lineup_config(config_id)
    if config_result.get("status") != "success":
        return config_result

    # Step 2: Delete Lineup
    lineup_result = delete_lineup(lineup_id)

    return lineup_result

