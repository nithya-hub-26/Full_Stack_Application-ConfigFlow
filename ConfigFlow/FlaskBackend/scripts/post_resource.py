import os
import requests
import json
import logging
from datetime import datetime
from post_custoken import generate_token
from vsm_utils import *

# Create logs directory if it doesn't exist
LOGS_DIR = "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# Generate log file name with current date and time
log_filename = os.path.join(LOGS_DIR, datetime.now().strftime("vsm_logs_%Y-%m-%d_%H-%M-%S.log"))

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s", filename=log_filename)

def post_resource():
    url_path = get_url() + "/resources"
    headers = {
        "accept": "application/json",
        "CustomToken": get_token(),
        "Content-Type": "application/json"
    }

    try:
        with open("post_resource.json", "r") as file:
            data = json.load(file)
        logging.info("Loaded data from post_resource.json")
    except FileNotFoundError:
        logging.error("The file post_resource.json was not found.")
        return
    except json.JSONDecodeError:
        logging.error("The file post_resource.json contains invalid JSON.")
        return

    logging.info("Sending POST request to URL: %s", url_path)

    response = requests.post(url=url_path, json=data, headers=headers, verify="cert2.pem")

    if response.status_code == 201:
        logging.info("Request successful. Response status: %d", response.status_code)
        json_string = json.dumps(response.json(), indent=4)
        logging.info("Response JSON: \n%s", json_string)
        return {"status": "success", "message": "Resource is created successfully"}
    elif response.status_code == 401:
        logging.warning("Unauthorized access. Status: %d. Regenerating token...", response.status_code)
        generate_token()
        return {"status": "failure", "errorMessage": "401. Unauthorized access. Token regenerated."}
    elif response.status_code == 409:
        logging.error(
            "Resource creation failed. Status: %d. Reason: %s. Resource with given IP address or name already exists",
            response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Creation failed. Reason: " + response.reason}
    else:
        logging.error("Request failed. Status: %d. Reason: %s", response.status_code, response.reason)
        return {"status": "failure", "errorMessage": "Post Request failed. Reason: " + response.reason}

if __name__ == "__main__":
    logging.info("Starting the post_resource process.")
    result = post_resource()
    print(json.dumps(result)) # dumps from JSON obj to JSON str
    logging.info("Finished the post_resource process.")
