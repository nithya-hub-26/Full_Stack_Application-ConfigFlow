import os
import json
from flask import jsonify

def get_activated_ids():
    try:
        if not os.path.exists("stored_activate_ids.json"):
            return jsonify({
                "status": "error",
                "message": "No activated IDs stored yet."
            }), 404

        with open("stored_activate_ids.json", "r") as f:
            activate_ids = json.load(f)

        return jsonify({
            "status": "success",
            "ids": activate_ids
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
