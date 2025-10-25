import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

// CHANGE THIS to your computer's IP address when testing on phone
// Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
const API_URL = 'http://localhost:5001';  // Use your IP like 'http://192.168.1.x:5001' for real device

export default function App() {
  const [location, setLocation] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      // Automatically get risk for current location
      checkRisk(loc.coords.latitude, loc.coords.longitude);
    })();
  }, []);

  // Call backend to get risk classification
  const checkRisk = async (lat, lon) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/risk`, {
        latitude: lat,
        longitude: lon,
      });
      setRiskData(response.data);
    } catch (error) {
      console.error('Error getting risk:', error);
      Alert.alert('Error', 'Could not connect to backend. Make sure it is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  // When user taps on map, check risk for that location
  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    checkRisk(latitude, longitude);
  };

  if (!location) {
    return (
      <View style={styles.container}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={location}
        onPress={handleMapPress}
      >
        {riskData && (
          <Marker
            coordinate={{
              latitude: riskData.latitude,
              longitude: riskData.longitude,
            }}
            pinColor={riskData.color}
          />
        )}
      </MapView>

      {/* Risk info card at bottom */}
      {riskData && (
        <View style={[styles.infoCard, { borderLeftColor: riskData.color }]}>
          <Text style={styles.infoTitle}>Safety Level</Text>
          <Text style={[styles.riskLevel, { color: riskData.color }]}>
            {riskData.risk_level.toUpperCase()}
          </Text>
          <Text style={styles.infoDetail}>
            Risk Score: {(riskData.risk_score * 100).toFixed(0)}%
          </Text>
          <Text style={styles.infoHint}>
            Tap anywhere on the map to check safety
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Checking risk...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  riskLevel: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoDetail: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  infoHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
  },
});
