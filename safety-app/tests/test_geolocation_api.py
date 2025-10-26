import unittest
import json
from flask import Flask
from backend.geolocation_api import geolocation_api

class GeolocationApiTestCase(unittest.TestCase):
    def setUp(self):
        app = Flask(__name__)
        app.register_blueprint(geolocation_api)
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_valid_request(self):
        data = {
            "latitude": 37.7749,
            "longitude": -122.4194,
            "hour": 15,
            "day_of_week": "Monday"
        }
        response = self.client.post('/predict-risk', json=data)
        print(response.status_code, response.get_json())
        self.assertEqual(response.status_code, 200)
        self.assertIn('risk_label', response.get_json())

    def test_missing_field(self):
        data = {"latitude": 37.77}  # missing longitude
        response = self.client.post('/predict-risk', json=data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.get_json())

    def test_invalid_type(self):
        data = {
            "latitude": "not_a_number",
            "longitude": -122.4194
        }
        response = self.client.post('/predict-risk', json=data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.get_json())

    def test_auto_now(self):
        # Missing hour and day_of_week, should default to current
        data = {
            "latitude": 37.7749,
            "longitude": -122.4194
        }
        response = self.client.post('/predict-risk', json=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('risk_label', response.get_json())

if __name__ == '__main__':
    unittest.main()
