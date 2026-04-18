import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTE_KEY = '@audio_muted';
const THEME_URL = 'https://customer-assets.emergentagent.com/job_dice-point-chase/artifacts/k7zi28m5_8bit-ROLL%20IT%20UP%2031-8%201.wav.wav';

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playMusic: () => void;
  stopMusic: () => void;
}

const AudioContext = createContext<AudioContextType>({
  isMuted: false,
  toggleMute: () => {},
  playMusic: () => {},
  stopMusic: () => {},
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const player = useAudioPlayer(THEME_URL);

  // Load mute preference on mount
  useEffect(() => {
    AsyncStorage.getItem(MUTE_KEY).then(val => {
      const muted = val === 'true';
      setIsMuted(muted);
      if (!muted) setShouldPlay(true);
    }).catch(() => {});
  }, []);

  // Control playback based on state
  useEffect(() => {
    if (!player) return;
    player.loop = true;
    player.volume = 0.4;

    if (shouldPlay && !isMuted) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay, isMuted, player]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    AsyncStorage.setItem(MUTE_KEY, newMuted ? 'true' : 'false').catch(() => {});
    if (newMuted && player) {
      player.pause();
    } else if (!newMuted && shouldPlay && player) {
      player.play();
    }
  };

  const playMusic = () => {
    setShouldPlay(true);
  };

  const stopMusic = () => {
    setShouldPlay(false);
    if (player) player.pause();
  };

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute, playMusic, stopMusic }}>
      {children}
    </AudioContext.Provider>
  );
};
