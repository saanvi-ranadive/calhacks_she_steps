import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  LiveKitRoom,
  useParticipants,
  useRoomContext,
  AudioSession,
  useLocalParticipant,
} from '@livekit/react-native';
import { RoomEvent } from 'livekit-client';

const LIVEKIT_URL = process.env.EXPO_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-url.livekit.cloud';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

function VoiceAgentRoom() {
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentStatus, setAgentStatus] = useState('Initializing...');

  useEffect(() => {
    if (!room) return;

    const handleConnected = () => {
      setIsConnected(true);
      setAgentStatus('Connected to voice agent');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setAgentStatus('Disconnected');
    };

    const handleParticipantConnected = () => {
      setAgentStatus('Voice agent ready');
    };

    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);

    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
    };
  }, [room]);

  useEffect(() => {
    // Track if local participant is speaking
    if (localParticipant && localParticipant.isSpeaking) {
      setIsSpeaking(true);
    } else {
      setIsSpeaking(false);
    }
  }, [localParticipant?.isSpeaking]);

  const handleDisconnect = async () => {
    if (room) {
      await room.disconnect();
    }
  };

  return (
    <View style={styles.roomContainer}>
      <View style={styles.statusCard}>
        <View style={[styles.statusIndicator, isConnected ? styles.connected : styles.disconnected]} />
        <Text style={styles.statusText}>{agentStatus}</Text>
      </View>

      <View style={styles.waveformContainer}>
        <Text style={styles.assistantLabel}>Safety Assistant</Text>
        <View style={styles.waveform}>
          {isSpeaking ? (
            <View style={styles.speakingIndicator}>
              <Text style={styles.speakingText}>Listening...</Text>
              <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
          ) : (
            <View style={styles.idleIndicator}>
              <Text style={styles.idleText}>Tap to speak</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How can I help you?</Text>
        <Text style={styles.infoText}>
          Ask me about safety information, emergency contacts, or get real-time assistance.
        </Text>
        <Text style={styles.participantCount}>
          {participants.length} participant{participants.length !== 1 ? 's' : ''} in room
        </Text>
      </View>

      <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
        <Text style={styles.disconnectButtonText}>End Session</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function VoiceAgentScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInRoom, setIsInRoom] = useState(false);

  useEffect(() => {
    // Start audio session when component mounts
    const startAudio = async () => {
      try {
        await AudioSession.startAudioSession();
        console.log('Audio session started successfully');
      } catch (error) {
        console.error('Failed to start audio session:', error);
        Alert.alert('Audio Error', 'Failed to start audio session. Please check microphone permissions.');
      }
    };

    startAudio();

    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  const connectToAgent = async () => {
    setIsLoading(true);
    try {
      // Request a token from your backend
      const response = await fetch(`${API_URL}/api/voice-agent/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: `safety-agent-${Date.now()}`,
          participantName: 'User',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get token');
      }

      const data = await response.json();
      setToken(data.token);
      setIsInRoom(true);
    } catch (error) {
      console.error('Error connecting to agent:', error);
      Alert.alert(
        'Connection Error',
        'Could not connect to voice agent. Please make sure your backend server is running.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isInRoom && token) {
    return (
      <LiveKitRoom
        serverUrl={LIVEKIT_URL}
        token={token}
        connect={true}
        options={{
          adaptiveStream: { pixelDensity: 'screen' },
        }}
        audio={true}
        video={false}
        onDisconnected={() => {
          setIsInRoom(false);
          setToken(null);
        }}>
        <VoiceAgentRoom />
      </LiveKitRoom>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Safety Assistant</Text>
        <Text style={styles.subtitle}>
          Connect with an AI assistant to get safety information and support
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🗣️</Text>
          <Text style={styles.featureTitle}>Natural Conversation</Text>
          <Text style={styles.featureText}>Speak naturally and get instant responses</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🛡️</Text>
          <Text style={styles.featureTitle}>Safety Information</Text>
          <Text style={styles.featureText}>Ask about safety tips and emergency procedures</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📍</Text>
          <Text style={styles.featureTitle}>Location Aware</Text>
          <Text style={styles.featureText}>Get context-specific safety recommendations</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.connectButton, isLoading && styles.connectButtonDisabled]}
        onPress={connectToAgent}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.connectButtonText}>Start Voice Session</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Note: Make sure your backend server is running with LiveKit agent configured
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  roomContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 60,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  connected: {
    backgroundColor: '#10B981',
  },
  disconnected: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assistantLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 30,
  },
  waveform: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  speakingIndicator: {
    alignItems: 'center',
  },
  speakingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 16,
  },
  idleIndicator: {
    alignItems: 'center',
  },
  idleText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  participantCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  disconnectButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
