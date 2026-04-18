import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTE_KEY = '@audio_muted';
const THEME_URL = 'https://customer-assets.emergentagent.com/job_dice-point-chase/artifacts/k7zi28m5_8bit-ROLL%20IT%20UP%2031-8%201.wav.wav';

// SFX assets
const SFX_ROLL = require('../assets/audio/dice_roll.wav');
const SFX_SCORE = require('../assets/audio/score.wav');
const SFX_BUST = require('../assets/audio/bust.wav');
const SFX_WIN = require('../assets/audio/win.wav');
const SFX_SELECT = require('../assets/audio/select.wav');

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playMusic: () => void;
  stopMusic: () => void;
  sfxRoll: () => void;
  sfxScore: () => void;
  sfxBust: () => void;
  sfxWin: () => void;
  sfxSelect: () => void;
}

const AudioContext = createContext<AudioContextType>({
  isMuted: false,
  toggleMute: () => {},
  playMusic: () => {},
  stopMusic: () => {},
  sfxRoll: () => {},
  sfxScore: () => {},
  sfxBust: () => {},
  sfxWin: () => {},
  sfxSelect: () => {},
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);

  // Music player
  const musicPlayer = useAudioPlayer(THEME_URL);

  // SFX players
  const rollPlayer = useAudioPlayer(SFX_ROLL);
  const scorePlayer = useAudioPlayer(SFX_SCORE);
  const bustPlayer = useAudioPlayer(SFX_BUST);
  const winPlayer = useAudioPlayer(SFX_WIN);
  const selectPlayer = useAudioPlayer(SFX_SELECT);

  // Load mute preference
  useEffect(() => {
    AsyncStorage.getItem(MUTE_KEY).then(val => {
      const muted = val === 'true';
      setIsMuted(muted);
      if (!muted) setShouldPlay(true);
    }).catch(() => {});
  }, []);

  // Music control
  useEffect(() => {
    if (!musicPlayer) return;
    musicPlayer.loop = true;
    musicPlayer.volume = 0.4;
    if (shouldPlay && !isMuted) {
      musicPlayer.play();
    } else {
      musicPlayer.pause();
    }
  }, [shouldPlay, isMuted, musicPlayer]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    AsyncStorage.setItem(MUTE_KEY, newMuted ? 'true' : 'false').catch(() => {});
    if (newMuted && musicPlayer) musicPlayer.pause();
    else if (!newMuted && shouldPlay && musicPlayer) musicPlayer.play();
  };

  const playMusic = () => setShouldPlay(true);

  const stopMusic = () => {
    setShouldPlay(false);
    if (musicPlayer) musicPlayer.pause();
  };

  // SFX helpers
  const playSfx = (player: any) => {
    if (isMuted || !player) return;
    try {
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.log('SFX play error:', e);
    }
  };

  const sfxRoll = () => playSfx(rollPlayer);
  const sfxScore = () => playSfx(scorePlayer);
  const sfxBust = () => playSfx(bustPlayer);
  const sfxWin = () => playSfx(winPlayer);
  const sfxSelect = () => playSfx(selectPlayer);

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute, playMusic, stopMusic, sfxRoll, sfxScore, sfxBust, sfxWin, sfxSelect }}>
      {children}
    </AudioContext.Provider>
  );
};
