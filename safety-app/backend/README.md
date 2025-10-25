# Backend

Simple Flask API for risk classification.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

Server runs on `http://localhost:5001`

## Add Your ML Logic

Edit `app.py` and replace the `get_risk_classification()` function with your actual Python script logic.

## Test

```bash
curl -X POST http://localhost:5001/api/risk \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'
```
