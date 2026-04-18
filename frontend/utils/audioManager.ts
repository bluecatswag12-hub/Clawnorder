import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTE_KEY = '@audio_muted';

let bgMusic: Audio.Sound | null = null;
let isMuted = false;
let isPlaying = false;

// Load mute preference
export async function loadMutePreference() {
  try {
    const val = await AsyncStorage.getItem(MUTE_KEY);
    isMuted = val === 'true';
  } catch {}
}

export function getIsMuted() {
  return isMuted;
}

export async function setMuted(muted: boolean) {
  isMuted = muted;
  try {
    await AsyncStorage.setItem(MUTE_KEY, muted ? 'true' : 'false');
  } catch {}
  if (muted) {
    await stopBgMusic();
  }
}

// Background music
export async function playBgMusic() {
  if (isMuted) return;
  if (isPlaying && bgMusic) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    if (!bgMusic) {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/audio/theme.wav'),
        { isLooping: true, volume: 0.4, shouldPlay: true }
      );
      bgMusic = sound;
    } else {
      await bgMusic.setIsLoopingAsync(true);
      await bgMusic.setVolumeAsync(0.4);
      await bgMusic.playAsync();
    }
    isPlaying = true;
  } catch (e) {
    console.error('Failed to play bg music:', e);
  }
}

export async function stopBgMusic() {
  if (bgMusic && isPlaying) {
    try {
      await bgMusic.stopAsync();
    } catch {}
    isPlaying = false;
  }
}

export async function unloadBgMusic() {
  if (bgMusic) {
    try {
      await bgMusic.unloadAsync();
    } catch {}
    bgMusic = null;
    isPlaying = false;
  }
}

// Sound effects
async function playSfx(frequency: number, duration: number, type: 'sine' | 'square' = 'sine') {
  // expo-av can't synthesize audio, so we use pre-generated short sounds
  // For now, use haptics as feedback and skip audio synthesis
}

export async function playDiceRollSfx() {
  if (isMuted) return;
  // Use a quick haptic as placeholder - actual sound would need a .wav file
}

export async function playScoreSfx() {
  if (isMuted) return;
}

export async function playBustSfx() {
  if (isMuted) return;
}

export async function playWinSfx() {
  if (isMuted) return;
}
