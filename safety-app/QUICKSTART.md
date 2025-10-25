# 🚀 Quick Start - 5 Minutes to Running App

## ✅ What You Have

A minimal working app with:
- **Backend**: Flask API that takes (lat, lon) → returns risk level
- **Mobile**: React Native map where you tap to check risk

## 📁 Project Structure

```
safety-app/
├── backend/
│   ├── app.py              ← YOUR ML LOGIC GOES HERE
│   ├── requirements.txt
│   └── venv/               (created)
└── mobile/
    ├── App.js              ← Map interface
    ├── package.json
    └── node_modules/       (after npm install)
```

## 🏃 Run It Now

### Terminal 1: Backend ✅ RUNNING

```bash
cd backend
source venv/bin/activate
python app.py
```

**✅ Already running on http://localhost:5001**

### Terminal 2: Mobile App

```bash
cd mobile
npm install
npm start
```

Press `i` for iOS or `a` for Android.

## 🧪 Test Backend (Already Working)

```bash
curl -X POST http://localhost:5001/api/risk \
  -H "Content-Type: application/json" \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'
```

Returns:
```json
{
  "color": "#F59E0B",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "risk_level": "moderate",
  "risk_score": 0.5
}
```

## 🎯 Next Steps

### 1. Add Your ML Logic (PRIORITY)

Edit `backend/app.py`, line 11-30:

```python
def get_risk_classification(latitude, longitude):
    """
    Replace this with your actual ML script!
    """
    # TODO: Your dataset parsing and ML classification here

    # Example - replace with your logic:
    risk_score = your_ml_model.predict(latitude, longitude)

    if risk_score < 0.3:
        risk_level = "safe"
        color = "#10B981"
    elif risk_score < 0.7:
        risk_level = "moderate"
        color = "#F59E0B"
    else:
        risk_level = "high"
        color = "#EF4444"

    return {
        "latitude": latitude,
        "longitude": longitude,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "color": color
    }
```

### 2. Test Mobile App

1. Open app on phone/simulator
2. Tap anywhere on map
3. See risk level appear at bottom (green/yellow/red card)

### 3. If Testing on Real Device

Edit `mobile/App.js` line 9:

```javascript
const API_URL = 'http://YOUR_COMPUTER_IP:5001';
```

Find your IP:
- Mac: `ifconfig | grep inet`
- Windows: `ipconfig`

Example: `http://192.168.1.100:5001`

## 🔧 Troubleshooting

**Backend not running?**
```bash
cd backend
source venv/bin/activate
python app.py
```

**Mobile app can't connect?**
- Check API_URL in `mobile/App.js` (line 9)
- Make sure backend shows "Running on http://127.0.0.1:5001"
- If on real device, use your computer's IP address

**Permission errors on mobile?**
- Allow location access when prompted

## 📱 How It Works

```
User taps map
    ↓
Sends {lat, lon} to http://localhost:5001/api/risk
    ↓
Backend runs get_risk_classification()
    ↓
Returns {risk_score, risk_level, color}
    ↓
App shows colored pin + info card
```

## 🎨 What You'll See

1. **Map**: Shows your current location
2. **Tap anywhere**: Checks risk for that spot
3. **Info card**: Appears at bottom with:
   - Risk level (SAFE/MODERATE/HIGH)
   - Risk score percentage
   - Color coded (green/yellow/red)
4. **Pin**: Drops on map with matching color

## ⚡ That's It!

You now have a working MVP. Add your ML logic and you're done with Phase 1!
