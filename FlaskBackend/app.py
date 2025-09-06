import json
import subprocess
from flask import Flask, Response
from flask_cors import CORS

from scripts.delete_lineup_config import delete_lineup_config
from scripts.delete_lineup_folder import delete_lineup_folder
from scripts.delete_pool import delete_pool
from scripts.delete_lineup import delete_lineup
from scripts.get_config_id import get_config_id
from scripts.get_lineup_config import get_lineup_config
from scripts.get_lineup_folders import get_lineup_folders
from scripts.get_lineups import get_lineups
from scripts.get_logs import get_logs
from scripts.get_pools import get_pools
from scripts.get_resources import get_resources
from scripts.get_sources import get_sources
from scripts.post_lineup_config import post_lineup_config
from scripts.post_lineup_folder import post_lineup_folder
from scripts.post_lineups import post_lineups
from scripts.post_pools import post_pools
from scripts.put_lineupId import put_lineup
from scripts.put_lineup_config import put_lineup_config
from scripts.put_lineup_folder import put_lineup_folder
from scripts.put_pools import put_pools

app = Flask(__name__)

# Allow CORS(Cross-origin resource sharing) for all routes and origin specified
CORS(app, resources={r"/*": {"origins": ["http://localhost:4200", "http://localhost:3000"]}})

LOGS_DIR = "logs"

# Function to run a Python script using subprocess
def run_python_script(script_name):
    try:
        # Run the script and capture the response
        result = subprocess.run(['python', f'./scripts/{script_name}.py'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return Response(json.dumps(result.stdout), status=200, mimetype="application/json")
    except Exception as e:
        # Catch and return any unexpected errors
        return Response(json.dumps({"status": "failure", "errorMessage": str(e)}), status=500, mimetype="application/json")


@app.route('/')
def heloo():
    return "working"

@app.route('/generate-token', methods=['POST'])
def post_token():
    return run_python_script('post_custoken')

@app.route('/list-dashboards', methods=['GET'])
def list_dashboards():
   return run_python_script('get_dashboards')

@app.route('/list-lineups', methods=['GET'])
def list_lineups():
   return get_lineups()

@app.route('/create-lineup', methods=['POST'])
def create_lineup():
   return post_lineups()

@app.route('/del-lineup/<lineup_id>', methods=['DELETE'])
def del_lineup(lineup_id):
    return delete_lineup(lineup_id)

@app.route('/update-lineup', methods=['PUT'])
def update_lineup():
   return put_lineup()


@app.route('/list-lineup-folders', methods=['GET'])
def list_lineup_folders():
   return get_lineup_folders()

@app.route('/create-lineup-folder', methods=['POST'])
def create_lineup_folder():
   return post_lineup_folder()

@app.route('/list-config/<configId>', methods=['GET'])
def list_config(configId):
    return get_config_id(configId)

@app.route('/list-lineup-configs/<lineupId>', methods=['GET'])
def list_lineup_config(lineupId):
    return get_lineup_config(lineupId)

@app.route('/create-lineup-config/<lineupId>', methods=['POST'])
def create_lineup_config(lineupId):
    return post_lineup_config(lineupId)

@app.route('/update-lineup-config/<config_id>', methods=['PUT'])
def update_lineup_config(config_id):
   return put_lineup_config(config_id)

@app.route('/del-lineup-config/<config_id>', methods=['DELETE'])
def del_lineup_config(config_id):
    return delete_lineup_config(config_id)

@app.route('/update-lineup-folder', methods=['PUT'])
def update_lineup_folder():
   return put_lineup_folder()

@app.route('/del-lineup-folder/<folder_id>', methods=['DELETE'])
def del_lineup_folder(folder_id):
    return delete_lineup_folder(folder_id)

@app.route('/list-sources', methods=['GET'])
def list_sources():
   return get_sources()

@app.route('/list-resources', methods=['GET'])
def list_resources():
   return get_resources()

@app.route('/create-resource', methods=['POST'])
def create_resource():
   return run_python_script('post_resource')


@app.route('/list-pools', methods=['GET'])
def list_pools():
   return get_pools()

@app.route('/create-pool', methods=['POST'])
def create_pool():
    return post_pools()

@app.route('/update-pool', methods=['PUT'])
def update_pool():
    return put_pools()

@app.route('/del-pool/<pool_id>', methods=['DELETE'])
def del_pool(pool_id):
    return delete_pool(pool_id)

@app.route('/get-logs/<log_file>', methods=['GET'])
def get_log_content(log_file):
    return get_logs(log_file)

@app.route('/list-ResourcesFromPool', methods=['GET'])
def list_ResourcesFromPool():
   return run_python_script('get_ResourcesFromPool')

@app.route('/add-ResourceToPool', methods=['PUT'])
def add_ResourceToPool():
   return run_python_script('put_ResourceToPool')

@app.route('/del-ResourceFromPool', methods=['DELETE'])
def delete_ResourceFromPool():
   return run_python_script('delete_ResourceFromPool')


if __name__ == '__main__':
    app.run(debug=True)


