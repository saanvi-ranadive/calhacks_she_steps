"""
Simple Flask backend for risk classification
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)  # Allow React Native to call this API

# TODO: Replace this with your actual ML risk classification logic
def get_risk_classification(latitude, longitude):
    """
    ML logic goes here!
    For now, this is a placeholder that returns mock data.

    Replace this function with actual dataset parsing and risk classification.
    """
    # Example placeholder logic - varies by location for demo
    # Use lat/lon to create some variation
    base_risk = abs((latitude * longitude) % 1)
    risk_score = min(max(base_risk, 0.0), 1.0)

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


def generate_sf_heatmap_grid():
    """
    Generate a grid of risk scores for San Francisco heat map
    SF bounds: lat 37.7 to 37.82, lon -122.52 to -122.35
    """
    grid = []
    # Create a 20x20 grid
    lat_step = (37.82 - 37.7) / 20
    lon_step = (-122.35 - (-122.52)) / 20

    for i in range(20):
        for j in range(20):
            lat = 37.7 + (i * lat_step)
            lon = -122.52 + (j * lon_step)

            # Get risk score for this point
            result = get_risk_classification(lat, lon)
            grid.append({
                "lat": lat,
                "lon": lon,
                "risk": result["risk_score"]
            })

    return grid


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


@app.route('/api/heatmap', methods=['GET'])
def get_heatmap():
    """
    Get heat map grid of risk scores for San Francisco

    Returns array of points: [{ lat, lon, risk }, ...]
    """
    grid = generate_sf_heatmap_grid()
    return jsonify({"grid": grid})


if __name__ == '__main__':
    print("🚀 Starting backend server on http://localhost:5001")
    print("📍 Test endpoint: POST http://localhost:5001/api/risk")
    print("🗺️  Heat map endpoint: GET http://localhost:5001/api/heatmap")
    app.run(debug=True, host='0.0.0.0', port=5001)
