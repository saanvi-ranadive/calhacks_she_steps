import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import axios from 'axios';

const API_URL = 'http://localhost:5001'; // change to your IP if testing on phone

export default function MapScreen() {
  const [heatmap, setHeatmap] = useState([]);
  const [clicked, setClicked] = useState<{ lat: number; lon: number } | null>(null);
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHeatmap();
  }, []);

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
      const res = await axios.post(`${API_URL}/api/risk`, {
        latitude: lat,
        longitude: lon,
      });
      setRisk(res.data);
    } catch {
      Alert.alert('Error', 'Cannot connect to backend.');
    } finally {
      setLoading(false);
    }
  }

  const getColor = (r: number) =>
    r < 0.3 ? '#10B981' : r < 0.7 ? '#F59E0B' : '#EF4444';
  const getRadius = (r: number) => 150 + r * 300;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
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

        {clicked && (
          <Marker
            coordinate={{ latitude: clicked.lat, longitude: clicked.lon }}
            pinColor={risk?.color || '#8B5CF6'}
          />
        )}
      </MapView>

      {loading && <ActivityIndicator style={styles.loader} size="large" color="#8B5CF6" />}

      {risk && !loading && (
        <View style={[styles.card, { borderLeftColor: risk.color }]}>
          <Text style={[styles.title, { color: risk.color }]}>
            {risk.risk_level.toUpperCase()}
          </Text>
          <Text>Risk Score: {(risk.risk_score * 100).toFixed(0)}%</Text>
          <Text style={styles.coords}>
            {risk.latitude.toFixed(4)}, {risk.longitude.toFixed(4)}
          </Text>
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
});
