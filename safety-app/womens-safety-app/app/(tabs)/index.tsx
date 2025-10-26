import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, TouchableOpacity, Platform, PermissionsAndroid, TextInput, Keyboard, Vibration } from 'react-native';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

const API_URL = 'http://localhost:5001'; // change to your IP if testing on phone

interface Route {
  coordinates: { latitude: number; longitude: number }[];
  safetyScore: number;
  riskLevel: 'safe' | 'moderate' | 'high';
  color: string;
  distance: number;
  duration: number;
  instructions?: string[];
  dangerZones?: DangerZone[];
}

interface DangerZone {
  startIndex: number;
  endIndex: number;
  riskLevel: 'moderate' | 'high';
  color: string;
  coordinates: { latitude: number; longitude: number }[];
}

export default function MapScreen() {
  const [heatmap, setHeatmap] = useState([]);
  const [clicked, setClicked] = useState<{ lat: number; lon: number } | null>(null);
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapRef, setMapRef] = useState<MapView | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Route planning state
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);

  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState(0);
  const [distanceToDestination, setDistanceToDestination] = useState(0);
  const [distanceToNext, setDistanceToNext] = useState(0);
  const [nearbyDangerZone, setNearbyDangerZone] = useState<DangerZone | null>(null);
  const [hasAlertedDanger, setHasAlertedDanger] = useState(false);
  const navigationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadHeatmap();
    requestLocationPermission();

    // Cleanup location tracking on unmount
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
      if (navigationIntervalRef.current) {
        clearInterval(navigationIntervalRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  async function requestLocationPermission() {
    try {
      let hasPermission = false;

      if (Platform.OS === 'ios') {
        // iOS - request authorization
        const auth = await Geolocation.requestAuthorization('whenInUse');
        hasPermission = auth === 'granted';
      } else if (Platform.OS === 'android') {
        // Android - request permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for safety features.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      if (hasPermission) {
        startLiveLocationTracking();
      } else {
        Alert.alert(
          'Location Permission',
          'Location permission is needed to show your current position on the map.'
        );
      }
    } catch (err) {
      console.error('Error requesting location permission:', err);
    }
  }

  function startLiveLocationTracking() {
    try {
      // Get initial position first
      Geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          // Debug logging
          console.log('📍 Initial Location Received:');
          console.log('  Latitude:', position.coords.latitude);
          console.log('  Longitude:', position.coords.longitude);
          console.log('  Accuracy:', position.coords.accuracy, 'meters');
          console.log('  Altitude:', position.coords.altitude);
          console.log('  Speed:', position.coords.speed);
          console.log('  Timestamp:', new Date(position.timestamp).toISOString());

          setUserLocation(userLoc);

          // Center map on user's location
          if (mapRef) {
            mapRef.animateToRegion({
              latitude: userLoc.lat,
              longitude: userLoc.lon,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }, 1000);
          }

          // Check risk for initial location
          checkRisk(userLoc.lat, userLoc.lon);
        },
        (error) => {
          console.error('❌ Error getting current position:', error);
          console.error('  Code:', error.code);
          console.error('  Message:', error.message);
          Alert.alert('Location Error', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );

      // Start watching position
      const id = Geolocation.watchPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          // Debug logging for updates
          console.log('🔄 Location Update:');
          console.log('  Latitude:', position.coords.latitude);
          console.log('  Longitude:', position.coords.longitude);
          console.log('  Accuracy:', position.coords.accuracy, 'meters');

          setUserLocation(userLoc);
        },
        (error) => {
          console.error('❌ Error watching position:', error);
          console.error('  Code:', error.code);
          console.error('  Message:', error.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Update when moved 10 meters
          interval: 5000, // Android: update interval
          fastestInterval: 2000, // Android: fastest update interval
        }
      );

      watchIdRef.current = id;
    } catch (err) {
      console.error('Error starting location tracking:', err);
      Alert.alert('Error', 'Could not start location tracking.');
    }
  }

  function getCurrentLocation() {
    // Function to manually recenter on user's current location
    Geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setUserLocation(userLoc);

        if (mapRef) {
          mapRef.animateToRegion({
            latitude: userLoc.lat,
            longitude: userLoc.lon,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
        }

        // Re-check risk for current location
        checkRisk(userLoc.lat, userLoc.lon);
      },
      (error) => {
        console.error('Error getting current position:', error);
        Alert.alert('Location Error', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  }

  async function loadHeatmap() {
    try {
      const res = await axios.get(`${API_URL}/api/heatmap`);
      setHeatmap(res.data.grid);
    } catch (err) {
      Alert.alert('Error', 'Could not load heatmap data.');
    }
  }

  async function checkRisk(lat: number, lon: number) {
    setClicked({ lat, lon });
    setLoading(true);
    try {
      // Get current time and day
      const now = new Date();
      const hour = now.getHours(); // 0-23
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day_of_week = daysOfWeek[now.getDay()];

      // Call ML prediction endpoint
      const res = await axios.post(`${API_URL}/api/ml/predict-risk`, {
        latitude: lat,
        longitude: lon,
        hour: hour,
        day_of_week: day_of_week,
      });

      // Map risk_label (0, 1, 2) to our UI format
      const riskLabel = res.data.risk_label;
      let risk_level, color, risk_score;

      if (riskLabel === 0) {
        risk_level = 'safe';
        color = '#10B981'; // green
        risk_score = 0.2;
      } else if (riskLabel === 1) {
        risk_level = 'moderate';
        color = '#F59E0B'; // yellow
        risk_score = 0.5;
      } else {
        risk_level = 'high';
        color = '#EF4444'; // red
        risk_score = 0.8;
      }

      setRisk({
        latitude: lat,
        longitude: lon,
        risk_score: risk_score,
        risk_level: risk_level,
        color: color,
        hour: hour,
        day_of_week: day_of_week,
      });
    } catch (error) {
      console.error('Error checking risk:', error);
      Alert.alert('Error', 'Cannot connect to backend or ML model not ready.');
    } finally {
      setLoading(false);
    }
  }

  async function calculateRoutes() {
    if (!userLocation || !destination.trim()) {
      Alert.alert('Error', 'Please enter a destination');
      return;
    }

    setRoutesLoading(true);
    Keyboard.dismiss();

    try {
      // Geocode destination to get coordinates
      const destCoords = await geocodeDestination(destination);
      if (!destCoords) return;

      // Get routes using Google Maps Directions API
      // Note: You'll need a Google Maps API key with Directions API enabled
      const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

      const origin = `${userLocation.lat},${userLocation.lon}`;
      const dest = `${destCoords.lat},${destCoords.lon}`;

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&alternatives=true&mode=walking&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (response.data.status !== 'OK') {
        Alert.alert('Error', 'Could not find routes to destination');
        return;
      }

      // Process each route and evaluate safety
      const routesWithSafety: Route[] = await Promise.all(
        response.data.routes.map(async (route: any, index: number) => {
          const coordinates = decodePolyline(route.overview_polyline.points);
          const safetyScore = await evaluateRouteSafety(coordinates);

          const distance = route.legs[0].distance.value; // meters
          const duration = route.legs[0].duration.value; // seconds

          let riskLevel: 'safe' | 'moderate' | 'high';
          let color: string;

          if (safetyScore < 0.3) {
            riskLevel = 'safe';
            color = '#10B981'; // green
          } else if (safetyScore < 0.7) {
            riskLevel = 'moderate';
            color = '#F59E0B'; // yellow/orange
          } else {
            riskLevel = 'high';
            color = '#EF4444'; // red
          }

          return {
            coordinates,
            safetyScore,
            riskLevel,
            color,
            distance,
            duration,
          };
        })
      );

      // Sort routes by safety (safest first)
      routesWithSafety.sort((a, b) => a.safetyScore - b.safetyScore);

      setRoutes(routesWithSafety);
      setSelectedRoute(0); // Auto-select safest route

      // Fit map to show entire route
      if (mapRef && routesWithSafety[0]) {
        const allCoords = routesWithSafety[0].coordinates;
        mapRef.fitToCoordinates(allCoords, {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }

      console.log('📊 Routes calculated:');
      routesWithSafety.forEach((route, i) => {
        console.log(`  Route ${i + 1}: ${route.riskLevel} (${(route.safetyScore * 100).toFixed(1)}% risk)`);
      });

    } catch (error) {
      console.error('Error calculating routes:', error);
      Alert.alert('Error', 'Failed to calculate routes');
    } finally {
      setRoutesLoading(false);
    }
  }

  async function geocodeDestination(address: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

      console.log('🔑 API Key present:', GOOGLE_MAPS_API_KEY ? `Yes (${GOOGLE_MAPS_API_KEY.substring(0, 10)}...)` : 'No');

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );

      console.log('📍 Geocoding response status:', response.data.status);
      console.log('📍 Geocoding response:', JSON.stringify(response.data, null, 2));

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return { lat: location.lat, lon: location.lng };
      } else {
        let errorMsg = 'Could not find destination.';
        if (response.data.status === 'ZERO_RESULTS') {
          errorMsg = 'Address not found. Try being more specific (e.g., include city and state).';
        } else if (response.data.status === 'REQUEST_DENIED') {
          errorMsg = 'Google Maps API error. Check API key and enabled services.';
        }
        Alert.alert('Error', errorMsg);
        return null;
      }
    } catch (error) {
      console.error('Error geocoding destination:', error);
      Alert.alert('Error', 'Failed to geocode destination');
      return null;
    }
  }

  async function evaluateRouteSafety(coordinates: { latitude: number; longitude: number }[]): Promise<number> {
    // Sample points along the route (every ~50 meters or every 10th point)
    const sampleInterval = Math.max(1, Math.floor(coordinates.length / 20));
    const samplePoints = coordinates.filter((_, index) => index % sampleInterval === 0);

    // Get risk scores for all sample points
    const riskScores = await Promise.all(
      samplePoints.map(async (point) => {
        try {
          const now = new Date();
          const hour = now.getHours();
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const day_of_week = daysOfWeek[now.getDay()];

          const res = await axios.post(`${API_URL}/api/ml/predict-risk`, {
            latitude: point.latitude,
            longitude: point.longitude,
            hour: hour,
            day_of_week: day_of_week,
          });

          const riskLabel = res.data.risk_label;
          // Convert label to score: 0 = 0.2, 1 = 0.5, 2 = 0.8
          return riskLabel === 0 ? 0.2 : riskLabel === 1 ? 0.5 : 0.8;
        } catch (error) {
          console.error('Error checking point risk:', error);
          return 0.5; // Default to moderate risk if error
        }
      })
    );

    // Calculate average risk score for the route
    const avgRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    return avgRisk;
  }

  // Decode Google Maps polyline encoding to coordinates
  function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return poly;
  }

  const getColor = (r: number) =>
    r < 0.3 ? '#10B981' : r < 0.7 ? '#F59E0B' : '#EF4444';
  const getRadius = (r: number) => 150 + r * 300;

  // Calculate distance between two coordinates in meters
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Identify danger zones along the route
  async function identifyDangerZones(route: Route): Promise<DangerZone[]> {
    const dangerZones: DangerZone[] = [];
    const coordinates = route.coordinates;

    // Check every 10th point for risk (adjust granularity as needed)
    const checkInterval = Math.max(1, Math.floor(coordinates.length / 30));
    let currentZone: DangerZone | null = null;

    for (let i = 0; i < coordinates.length; i += checkInterval) {
      const point = coordinates[i];

      try {
        const now = new Date();
        const hour = now.getHours();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day_of_week = daysOfWeek[now.getDay()];

        const res = await axios.post(`${API_URL}/api/ml/predict-risk`, {
          latitude: point.latitude,
          longitude: point.longitude,
          hour: hour,
          day_of_week: day_of_week,
        });

        const riskLabel = res.data.risk_label; // 0 = safe, 1 = moderate, 2 = high

        if (riskLabel >= 1) {
          // Moderate or high risk
          if (!currentZone) {
            // Start new danger zone
            currentZone = {
              startIndex: i,
              endIndex: i,
              riskLevel: riskLabel === 1 ? 'moderate' : 'high',
              color: riskLabel === 1 ? '#F59E0B' : '#EF4444',
              coordinates: [point],
            };
          } else {
            // Extend current zone
            currentZone.endIndex = i;
            currentZone.coordinates.push(point);
            // Update risk level if higher
            if (riskLabel === 2) {
              currentZone.riskLevel = 'high';
              currentZone.color = '#EF4444';
            }
          }
        } else {
          // Safe zone - close current danger zone if any
          if (currentZone) {
            dangerZones.push(currentZone);
            currentZone = null;
          }
        }
      } catch (error) {
        console.error('Error checking danger zone:', error);
      }
    }

    // Add last zone if exists
    if (currentZone) {
      dangerZones.push(currentZone);
    }

    console.log(`🚨 Identified ${dangerZones.length} danger zones along route`);
    return dangerZones;
  }

  // Start navigation
  async function startNavigation() {
    if (selectedRoute === null || !routes[selectedRoute]) {
      Alert.alert('Error', 'Please select a route first');
      return;
    }

    const route = routes[selectedRoute];

    // Identify danger zones
    setRoutesLoading(true);
    const dangerZones = await identifyDangerZones(route);

    // Update route with danger zones
    const updatedRoutes = [...routes];
    updatedRoutes[selectedRoute] = { ...route, dangerZones };
    setRoutes(updatedRoutes);
    setRoutesLoading(false);

    // Start navigation
    setIsNavigating(true);
    setCurrentInstruction(0);
    setHasAlertedDanger(false);

    // Start tracking navigation progress
    navigationIntervalRef.current = setInterval(() => {
      if (userLocation) {
        updateNavigationProgress(userLocation, updatedRoutes[selectedRoute]);
      }
    }, 2000); // Update every 2 seconds

    Alert.alert(
      'Navigation Started',
      `Follow the ${route.riskLevel} route. Stay alert in danger zones!`,
      [{ text: 'OK' }]
    );
  }

  // Stop navigation
  function stopNavigation() {
    setIsNavigating(false);
    setCurrentInstruction(0);
    setNearbyDangerZone(null);
    setHasAlertedDanger(false);

    if (navigationIntervalRef.current) {
      clearInterval(navigationIntervalRef.current);
      navigationIntervalRef.current = null;
    }

    Alert.alert('Navigation Ended', 'You have stopped navigation.');
  }

  // Update navigation progress
  function updateNavigationProgress(location: { lat: number; lon: number }, route: Route) {
    const coords = route.coordinates;

    // Find closest point on route
    let minDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < coords.length; i++) {
      const dist = calculateDistance(location.lat, location.lon, coords[i].latitude, coords[i].longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    // Calculate remaining distance to destination
    let remainingDist = 0;
    for (let i = closestIndex; i < coords.length - 1; i++) {
      remainingDist += calculateDistance(
        coords[i].latitude,
        coords[i].longitude,
        coords[i + 1].latitude,
        coords[i + 1].longitude
      );
    }
    setDistanceToDestination(remainingDist);

    // Check if arrived (within 20 meters of destination)
    if (remainingDist < 20) {
      stopNavigation();
      Alert.alert('Arrived!', 'You have reached your destination safely! 🎉');
      return;
    }

    // Check proximity to danger zones
    if (route.dangerZones) {
      checkDangerProximity(location, route.dangerZones, coords);
    }
  }

  // Check if user is near a danger zone
  function checkDangerProximity(
    location: { lat: number; lon: number },
    dangerZones: DangerZone[],
    routeCoords: { latitude: number; longitude: number }[]
  ) {
    const ALERT_DISTANCE = 150; // Alert when within 150 meters of danger zone

    for (const zone of dangerZones) {
      // Check distance to start of danger zone
      const distToZone = calculateDistance(
        location.lat,
        location.lon,
        zone.coordinates[0].latitude,
        zone.coordinates[0].longitude
      );

      if (distToZone <= ALERT_DISTANCE) {
        setNearbyDangerZone(zone);

        // Only alert once per danger zone
        if (!hasAlertedDanger) {
          Vibration.vibrate([0, 200, 100, 200]); // Vibration pattern
          Alert.alert(
            '⚠️ Danger Zone Ahead',
            `${zone.riskLevel.toUpperCase()} risk area in ${Math.round(distToZone)} meters. Stay alert!`,
            [{ text: 'OK' }]
          );
          setHasAlertedDanger(true);
        }
        return;
      }
    }

    // Reset if no longer near danger zone
    if (nearbyDangerZone) {
      const distFromZone = calculateDistance(
        location.lat,
        location.lon,
        nearbyDangerZone.coordinates[nearbyDangerZone.coordinates.length - 1].latitude,
        nearbyDangerZone.coordinates[nearbyDangerZone.coordinates.length - 1].longitude
      );

      if (distFromZone > ALERT_DISTANCE) {
        setNearbyDangerZone(null);
        setHasAlertedDanger(false);
      }
    }
  }

  // Handle SOS emergency button press
  async function handleSOSPress() {
    // Vibrate immediately
    Vibration.vibrate([0, 500, 200, 500]);

    Alert.alert(
      '🚨 EMERGENCY',
      'What type of emergency are you experiencing?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Emergency cancelled'),
        },
        {
          text: 'Immediate Danger',
          style: 'destructive',
          onPress: () => dispatchEmergencyCall('assault', 'User reported immediate danger'),
        },
        {
          text: 'Medical Emergency',
          onPress: () => dispatchEmergencyCall('medical', 'User reported medical emergency'),
        },
        {
          text: 'Feel Unsafe',
          onPress: () => dispatchEmergencyCall('danger', 'User feels unsafe in current location'),
        },
      ],
      { cancelable: false }
    );
  }

  // Dispatch emergency call with full context
  async function dispatchEmergencyCall(emergencyType: string, situation: string) {
    try {
      if (!userLocation) {
        Alert.alert('Error', 'Unable to get your location for emergency call');
        return;
      }

      // Show loading alert
      Alert.alert('🚨 Calling Emergency Services', 'Please wait...');

      // Reverse geocode current location to get address
      let address = 'Address unavailable';
      try {
        const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        const geoResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLocation.lat},${userLocation.lon}&key=${GOOGLE_MAPS_API_KEY}`
        );
        if (geoResponse.data.status === 'OK' && geoResponse.data.results.length > 0) {
          address = geoResponse.data.results[0].formatted_address;
        }
      } catch (error) {
        console.error('Error getting address:', error);
      }

      // Build emergency context
      const emergencyContext = {
        // NOTE: For testing, use your own phone number. In production, this would be 911
        phone_number: '+1YOUR_TEST_NUMBER', // Replace with test number or 911
        emergency_type: emergencyType,
        situation: situation,
        location: {
          lat: userLocation.lat,
          lon: userLocation.lon,
          address: address,
        },
        user_profile: {
          // TODO: Get from user profile/settings
          name: 'App User',
          phone: '+1234567890',
          age: 25,
          medical_conditions: 'None reported',
        },
        timestamp: new Date().toISOString(),
        user_id: 'test_user_123', // TODO: Get from authentication
      };

      console.log('🚨 Dispatching emergency call:', emergencyContext);

      // Call backend to dispatch emergency agent
      const response = await axios.post(`${API_URL}/api/emergency/dispatch`, emergencyContext);

      if (response.data.success) {
        Alert.alert(
          'Emergency Call Initiated',
          `Emergency services are being contacted.\n\nRoom: ${response.data.room_name}\n\nStay on the line and the AI agent will relay your information to the dispatcher.`,
          [{ text: 'OK' }]
        );

        console.log('✅ Emergency call dispatched successfully');
      } else {
        throw new Error('Failed to dispatch emergency call');
      }
    } catch (error) {
      console.error('❌ Error dispatching emergency call:', error);
      Alert.alert(
        'Emergency Call Failed',
        'Unable to connect to emergency services. Please dial 911 directly.\n\nError: ' + (error as Error).message,
        [
          { text: 'OK' },
          {
            text: 'Retry',
            onPress: () => dispatchEmergencyCall(emergencyType, situation),
          },
        ]
      );
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={(ref) => setMapRef(ref)}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          checkRisk(latitude, longitude);
        }}
      >
        {heatmap.map((p: any, i: number) => (
          <Circle
            key={i}
            center={{ latitude: p.lat, longitude: p.lon }}
            radius={getRadius(p.risk)}
            fillColor={`${getColor(p.risk)}55`} // adds transparency (last two chars = alpha)
            strokeColor="transparent"           // no border
            strokeWidth={0}
          />

        ))}

        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lon }}
            title="Your Location"
            description="You are here"
            pinColor="#3B82F6"
          />
        )}

        {clicked && (
          <Marker
            coordinate={{ latitude: clicked.lat, longitude: clicked.lon }}
            pinColor={risk?.color || '#8B5CF6'}
          />
        )}

        {/* Display all routes */}
        {routes.map((route, index) => (
          <Polyline
            key={index}
            coordinates={route.coordinates}
            strokeColor={route.color}
            strokeWidth={selectedRoute === index ? 6 : 3}
            zIndex={selectedRoute === index ? 100 : 50}
            onPress={() => setSelectedRoute(index)}
          />
        ))}

        {/* Highlight danger zones on selected route */}
        {selectedRoute !== null && routes[selectedRoute]?.dangerZones?.map((zone, idx) => (
          <Polyline
            key={`danger-${idx}`}
            coordinates={zone.coordinates}
            strokeColor={zone.color}
            strokeWidth={8}
            zIndex={150}
            lineDashPattern={[10, 5]} // Dashed line for danger zones
          />
        ))}
      </MapView>

      {userLocation && (
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={getCurrentLocation}
        >
          <Text style={styles.myLocationButtonText}>📍</Text>
        </TouchableOpacity>
      )}

      {/* Destination input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter destination..."
          value={destination}
          onChangeText={setDestination}
          onSubmitEditing={calculateRoutes}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={calculateRoutes}
          disabled={routesLoading || !userLocation}
        >
          {routesLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Route selection panel */}
      {routes.length > 0 && !isNavigating && (
        <View style={styles.routesPanel}>
          <Text style={styles.routesPanelTitle}>Routes (Tap to select)</Text>
          {routes.map((route, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.routeOption,
                { borderLeftColor: route.color },
                selectedRoute === index && styles.routeOptionSelected,
              ]}
              onPress={() => setSelectedRoute(index)}
            >
              <View style={styles.routeOptionHeader}>
                <Text style={[styles.routeRiskLevel, { color: route.color }]}>
                  {route.riskLevel.toUpperCase()}
                </Text>
                <Text style={styles.routeNumber}>Route {index + 1}</Text>
              </View>
              <Text style={styles.routeDetails}>
                Safety: {((1 - route.safetyScore) * 100).toFixed(0)}% • {(route.distance / 1000).toFixed(1)} km • {Math.round(route.duration / 60)} min
              </Text>
            </TouchableOpacity>
          ))}

          {/* Start Navigation Button */}
          {selectedRoute !== null && (
            <TouchableOpacity
              style={styles.startNavigationButton}
              onPress={startNavigation}
              disabled={routesLoading}
            >
              {routesLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.startNavigationButtonText}>🧭 Start Navigation</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Navigation Control Panel */}
      {isNavigating && selectedRoute !== null && (
        <View style={styles.navigationPanel}>
          <View style={styles.navigationHeader}>
            <Text style={styles.navigationTitle}>Navigation Active</Text>
            <TouchableOpacity
              style={styles.stopNavigationButton}
              onPress={stopNavigation}
            >
              <Text style={styles.stopNavigationButtonText}>✕ Stop</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.navigationInfo}>
            <Text style={styles.navigationDistance}>
              📍 {distanceToDestination >= 1000
                ? `${(distanceToDestination / 1000).toFixed(1)} km`
                : `${Math.round(distanceToDestination)} m`} remaining
            </Text>

            {nearbyDangerZone && (
              <View style={[styles.dangerAlert, { backgroundColor: nearbyDangerZone.color + '22' }]}>
                <Text style={[styles.dangerAlertText, { color: nearbyDangerZone.color }]}>
                  ⚠️ {nearbyDangerZone.riskLevel.toUpperCase()} RISK ZONE AHEAD
                </Text>
                <Text style={styles.dangerAlertSubtext}>Stay alert and be aware of your surroundings</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* SOS Emergency Button - Always visible during navigation */}
      {isNavigating && (
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleSOSPress}
        >
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>
      )}

      {loading && <ActivityIndicator style={styles.loader} size="large" color="#8B5CF6" />}

      {risk && !loading && routes.length === 0 && (
        <View style={[styles.card, { borderLeftColor: risk.color }]}>
          <Text style={[styles.title, { color: risk.color }]}>
            {risk.risk_level.toUpperCase()}
          </Text>
          <Text>Risk Score: {(risk.risk_score * 100).toFixed(0)}%</Text>
          <Text style={styles.coords}>
            {risk.latitude.toFixed(4)}, {risk.longitude.toFixed(4)}
          </Text>
          {risk.hour !== undefined && risk.day_of_week && (
            <Text style={styles.timeInfo}>
              {risk.day_of_week} at {risk.hour}:00
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { position: 'absolute', top: '50%', left: '50%' },
  card: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  coords: { color: '#9CA3AF', marginTop: 4 },
  timeInfo: { color: '#6B7280', marginTop: 4, fontSize: 12, fontStyle: 'italic' },
  myLocationButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  myLocationButtonText: {
    fontSize: 24,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchButton: {
    backgroundColor: '#8B5CF6',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  searchButtonText: {
    fontSize: 22,
  },
  routesPanel: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    maxHeight: 250,
  },
  routesPanelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  routeOption: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    backgroundColor: '#F9FAFB',
  },
  routeOptionSelected: {
    backgroundColor: '#E0E7FF',
  },
  routeOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeRiskLevel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  routeNumber: {
    fontSize: 12,
    color: '#6B7280',
  },
  routeDetails: {
    fontSize: 12,
    color: '#374151',
  },
  startNavigationButton: {
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  startNavigationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigationPanel: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  stopNavigationButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  stopNavigationButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  navigationInfo: {
    gap: 12,
  },
  navigationDistance: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  dangerAlert: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  dangerAlertText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dangerAlertSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  sosButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#DC2626',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 4,
    borderColor: 'white',
  },
  sosButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
