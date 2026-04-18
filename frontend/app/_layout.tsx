import { Stack } from 'expo-router';
import { AudioProvider } from '../utils/AudioProvider';

export default function Layout() {
  return (
    <AudioProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1A110A' },
        }}
      />
    </AudioProvider>
  );
}
