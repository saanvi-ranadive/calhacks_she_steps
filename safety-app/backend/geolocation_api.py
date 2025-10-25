from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import sys
import os
from datetime import datetime

# Ensure ML path import
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ml'))
from test import predict_risk_label, train_model, _model_ready

geolocation_api = Blueprint('geolocation_api', __name__)

@geolocation_api.route('/predict-risk', methods=['POST'])
@cross_origin()
def predict_risk():
    data = request.get_json()
    required_fields = ['latitude', 'longitude']

    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field {field}'}), 400

    try:
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
    except Exception as e:
        return jsonify({'error': f'Invalid input type: {str(e)}'}), 400

    # Automatically get current time info if not provided
    now = datetime.now()
    hour = int(data.get('hour', now.hour))
    day_of_week = str(data.get('day_of_week', now.strftime('%A')))  # e.g. "Saturday"

    # Ensure model ready
    try:
        if not _model_ready:
            train_model()
    except Exception as e:
        return jsonify({"error": f"Model training failed: {str(e)}"}), 500

    # Predict
    try:
        risk_label = predict_risk_label(latitude, longitude, hour, day_of_week)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    return jsonify({'risk_label': risk_label})
