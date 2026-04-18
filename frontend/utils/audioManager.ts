import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTE_KEY = '@audio_muted';
const THEME_URL = 'https://customer-assets.emergentagent.com/job_dice-point-chase/artifacts/k7zi28m5_8bit-ROLL%20IT%20UP%2031-8%201.wav.wav';

let isMuted = false;
let audioElement: HTMLAudioElement | null = null;

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

export async function playBgMusic() {
  if (isMuted) return;

  try {
    // Use HTML5 Audio on web for reliability
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (!audioElement) {
        audioElement = new Audio(THEME_URL);
        audioElement.loop = true;
        audioElement.volume = 0.4;
      }
      if (audioElement.paused) {
        await audioElement.play();
      }
    }
  } catch (e) {
    console.log('Audio play blocked or failed:', e);
  }
}

export async function stopBgMusic() {
  try {
    if (audioElement && !audioElement.paused) {
      audioElement.pause();
    }
  } catch {}
}

export async function unloadBgMusic() {
  try {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      audioElement = null;
    }
  } catch {}
}
