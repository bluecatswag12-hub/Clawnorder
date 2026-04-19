import { Stack } from 'expo-router';
import { AudioProvider } from '../utils/AudioProvider';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

export default function Layout() {
  const [fontsLoaded, fontsError] = useFonts({
    ...Ionicons.font,
  });
  const [timedOut, setTimedOut] = useState(false);

  // Safety net: never block the app forever on font loading.
  // Some devices silently fail to resolve fonts — show the app anyway after 3s.
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Proceed as soon as fonts load, fail, or we timeout.
  const ready = fontsLoaded || !!fontsError || timedOut;

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A110A' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AudioProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#1A110A' },
          }}
        />
      </AudioProvider>
    </SafeAreaProvider>
  );
}
