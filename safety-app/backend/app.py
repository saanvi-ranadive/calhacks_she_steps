"""
Simple Flask backend for risk classification
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow React Native to call this API

# TODO: Replace this with your actual ML risk classification logic
def get_risk_classification(latitude, longitude):
    """
    Your ML logic goes here!
    For now, this is a placeholder that returns mock data.

    Replace this function with your actual dataset parsing and risk classification.
    """
    # Example placeholder logic
    risk_score = 0.5  # 0.0 = safe, 1.0 = dangerous

    if risk_score < 0.3:
        risk_level = "safe"
        color = "#10B981"  # green
    elif risk_score < 0.7:
        risk_level = "moderate"
        color = "#F59E0B"  # yellow
    else:
        risk_level = "high"
        color = "#EF4444"  # red

    return {
        "latitude": latitude,
        "longitude": longitude,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "color": color
    }


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})


@app.route('/api/risk', methods=['POST'])
def get_risk():
    """
    Get risk classification for a location

    POST body:
    {
        "latitude": 37.7749,
        "longitude": -122.4194
    }
    """
    data = request.get_json()
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if latitude is None or longitude is None:
        return jsonify({"error": "Missing latitude or longitude"}), 400

    result = get_risk_classification(latitude, longitude)
    return jsonify(result)


if __name__ == '__main__':
    print("🚀 Starting backend server on http://localhost:5001")
    print("📍 Test endpoint: POST http://localhost:5001/api/risk")
    app.run(debug=True, host='0.0.0.0', port=5001)
