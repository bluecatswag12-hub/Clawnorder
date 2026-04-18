import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTE_KEY = '@audio_muted';
const THEME_URL = 'https://customer-assets.emergentagent.com/job_dice-point-chase/artifacts/k7zi28m5_8bit-ROLL%20IT%20UP%2031-8%201.wav.wav';

let bgMusic: Audio.Sound | null = null;
let isMuted = false;
let isPlaying = false;
let isLoading = false;

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
  if (muted && bgMusic && isPlaying) {
    try {
      await bgMusic.pauseAsync();
      isPlaying = false;
    } catch {}
  }
}

export async function playBgMusic() {
  if (isMuted || isPlaying || isLoading) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    if (!bgMusic) {
      isLoading = true;
      const { sound } = await Audio.Sound.createAsync(
        { uri: THEME_URL },
        { isLooping: true, volume: 0.4, shouldPlay: true }
      );
      bgMusic = sound;
      isLoading = false;
      isPlaying = true;
    } else {
      await bgMusic.setIsLoopingAsync(true);
      await bgMusic.setVolumeAsync(0.4);
      await bgMusic.playAsync();
      isPlaying = true;
    }
  } catch (e) {
    isLoading = false;
    console.error('Failed to play bg music:', e);
  }
}

export async function stopBgMusic() {
  if (bgMusic && isPlaying) {
    try {
      await bgMusic.pauseAsync();
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
