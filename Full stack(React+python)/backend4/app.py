from flask import Flask
from flask_cors import CORS
import urllib3

from scripts.get_activated_ids import get_activated_ids
from scripts.get_alarm_messages import get_alarm_messages
from scripts.get_audio_templates import get_audio_templates
from scripts.get_linear_templates import get_linear_templates
from scripts.get_resourceState import get_resourceState
from scripts.get_resources import get_resources
from scripts.get_sources import get_sources
from scripts.get_destinations import get_destinations
from scripts.post_audio_templates import post_audio_templates
from scripts.post_active_or_deactivate_configs import post_active_or_deactivate_configs
from scripts.post_destination import post_destination
from scripts.post_linear_templates import post_linear_templates
from scripts.post_source import post_source
from scripts.put_audio_templates import put_audio_templates
from scripts.put_linear_templates import put_linear_templates
from scripts.put_sources import put_sources
from scripts.delete_source_or_destination import delete_source_or_destination
from scripts.delete_audio_template import delete_audio_template
from scripts.delete_linear_template import delete_linear_template

app = Flask(__name__)

# Allow CORS(Cross-origin resource sharing) for all routes and origin specified
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173",  "http://10.89.6.167"]}})

# Disable SSL warnings (only for dev)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

LOGS_DIR = "logs"

@app.route('/list-sources', methods=['GET'])
def list_sources():
    return get_sources()

@app.route('/list-destinations', methods=['GET'])
def list_destinations():
    return get_destinations()

@app.route('/list-audio-templates', methods=['GET'])
def list_audio_templates():
    return get_audio_templates()

@app.route('/list-video-templates', methods=['GET'])
def list_video_templates():
    return get_linear_templates()

@app.route('/list-resources', methods=['GET'])
def list_resources():
    return get_resources()

@app.route('/update-source/<source_id>', methods=['PUT'])
def update_source(source_id):
    return put_sources(source_id)

@app.route('/add-source', methods=['POST'])
def add_source():
    return post_source()

@app.route('/add-destination', methods=['POST'])
def add_destination():
    return post_destination()

@app.route('/delete-source', methods=['DELETE'])
def delete_source():
    return delete_source_or_destination()

@app.route('/delete-destination', methods=['DELETE'])
def delete_destination():
    return delete_source_or_destination()

@app.route('/get-activated-ids', methods=['GET'])
def list_activated_ids():
    return get_activated_ids()

@app.route('/post-active-or-deactivate-id/<config_id>', methods=['POST'])
def post_active_or_deactivate_ids(config_id):
    return post_active_or_deactivate_configs(config_id)

@app.route('/add-linear-template', methods=['POST'])
def post_linear_template():
    return post_linear_templates()

@app.route('/update-linear-template/<template_id>', methods=['PUT'])
def update_linear_template(template_id):
    return put_linear_templates(template_id)

@app.route('/add-audio-template', methods=['POST'])
def post_audio_template():
    return post_audio_templates()

@app.route('/update-audio-template/<template_id>', methods=['PUT'])
def update_audio_template(template_id):
    return put_audio_templates(template_id)

@app.route('/delete-audio-template/<template_id>', methods=['DELETE'])
def del_audio_template(template_id):
    return delete_audio_template(template_id)

@app.route('/delete-linear-template/<template_id>', methods=['DELETE'])
def del_linear_template(template_id):
    return delete_linear_template(template_id)

@app.route('/get-alarm-messages/<lineup_id>', methods=['GET'])
def list_alarm_messages(lineup_id):
    return get_alarm_messages(lineup_id)

@app.route('/get-resource-state/<url>', methods=['GET'])
def list_resource_state(url):
    return get_resourceState(url)



if __name__ == '__main__':
    app.run(port=5000)