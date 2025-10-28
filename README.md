# SheSteps — Women’s Safety App (CalHacks 11.0)

SheSteps is a mobile safety app that leverages machine learning and AI voice assistance to help users identify and avoid high-risk areas when walking or running alone. Built in 36 hours at CalHacks 12.0, it combines real-time risk prediction, Claude-powered voice guidance, and safety-optimized routing to make nighttime travel safer and more informed.

## Key Features

- ML-Powered Risk Prediction: Random Forest model trained on latitude, longitude, time, and day-of-week to classify area risk levels with ~88% accuracy.

- Safety-Optimized Routing: Integrated with Google Maps API to recommend routes with ~27% lower predicted risk than time-optimized paths.

- Real-Time Geolocation: Expo + React Native frontend displaying dynamic risk heatmaps.

- AI Voice Assistance: Integrated Claude API with LiveKit for contextual, real-time voice responses and emergency guidance.

## Tech Stack

**Frontend**: React Native, Expo

**Backend**: Flask (Python), REST API

**ML Model**: Random Forest (Scikit-learn, Pandas, NumPy)

**APIs & Services**: Claude API, Google Maps, LiveKit

### Demo
[Watch the demo video](<youtube.com/watch?reload=9&v=ow_1uuKUysY&t=3s>) or explore the prototype UI below:


