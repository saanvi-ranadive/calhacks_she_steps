# Backend

Simple Flask API for risk classification and LiveKit voice agent integration.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Configuration

For LiveKit voice agent support, create a `.env` file:

```bash
cp .env.example .env
```

Then edit `.env` and add your LiveKit credentials from https://cloud.livekit.io:

```
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
```

## Run

```bash
python app.py
```

Server runs on `http://localhost:5001`

## API Endpoints

### Risk Classification

```bash
curl -X POST http://localhost:5001/api/risk \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'
```

### Heatmap

```bash
curl http://localhost:5001/api/heatmap
```

### Voice Agent Token (NEW)

```bash
curl -X POST http://localhost:5001/api/voice-agent/token \
  -H "Content-Type: application/json" \
  -d '{"roomName": "safety-room", "participantName": "User"}'
```

## Add Your ML Logic

Edit `app.py` and replace the `get_risk_classification()` function with your actual Python script logic.
