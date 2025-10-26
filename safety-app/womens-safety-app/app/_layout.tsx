import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { registerGlobals } from '@livekit/react-native';

// Register LiveKit WebRTC globals
registerGlobals();

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
