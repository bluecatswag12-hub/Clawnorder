import { Stack } from 'expo-router';
import { AudioProvider } from '../utils/AudioProvider';

export default function Layout() {
  return (
    <AudioProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0d0d1a' },
        }}
      />
    </AudioProvider>
  );
}
