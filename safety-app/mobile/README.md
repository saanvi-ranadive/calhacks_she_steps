# Mobile App

Simple React Native app that displays a map and shows risk classification.

## Setup

```bash
cd mobile
npm install
```

## Run

```bash
npm start
```

Then press `i` for iOS simulator or `a` for Android emulator.

## Important: Update API URL

If testing on a **real device** (not simulator):

1. Find your computer's IP address:
   - Mac/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`

2. Edit `App.js` line 9:
   ```javascript
   const API_URL = 'http://YOUR_IP_ADDRESS:5001';
   // Example: 'http://192.168.1.100:5001'
   ```

## Usage

- App will show your current location on map
- Tap anywhere on the map to check the risk level for that location
- Risk level appears in a card at the bottom (green/yellow/red)
