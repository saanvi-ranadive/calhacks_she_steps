# Women's Safety App - Minimal Version

Super simple working version with just the essentials:
- Map interface on mobile
- Tap map to check risk level at any location
- Python backend with your ML risk classification logic

## Project Structure

```
safety-app/
├── backend/        # Flask API (Python)
│   ├── app.py      # ← Put your ML logic here
│   └── requirements.txt
└── mobile/         # React Native app
    ├── App.js      # Map interface
    └── package.json
```

## Quick Start

### 1. Start Backend (Terminal 1)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend runs on `http://localhost:5001`

### 2. Start Mobile App (Terminal 2)

```bash
cd mobile
npm install
npm start
```

Press `i` for iOS or `a` for Android.

## How It Works

1. **User opens app** → Map shows their location
2. **User taps on map** → Sends (latitude, longitude) to backend
3. **Backend** → Runs your ML classification → Returns risk level
4. **App** → Shows risk level as colored pin + info card

## Next Steps

1. **Add your ML logic**: Edit `backend/app.py` → `get_risk_classification()` function
2. **Test it**: Tap different locations on the map
3. **Expand**: Once this works, add more features incrementally

## Testing Backend

```bash
curl -X POST http://localhost:5001/api/risk \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'
```

Should return:
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "risk_score": 0.5,
  "risk_level": "moderate",
  "color": "#F59E0B"
}
```
