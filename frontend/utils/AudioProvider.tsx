import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUTE_KEY = '@audio_muted';

// Audio URLs
const TITLE_MUSIC_URL = 'https://customer-assets.emergentagent.com/job_dice-point-chase/artifacts/pjrz2luu_Game%20Title%20Music%20.mp3';
const INGAME_MUSIC_URL = 'https://customer-assets.emergentagent.com/job_dice-point-chase/artifacts/4p1m1t64_In%20game%20music%20.mp3';
const DICE_ROLL_URL = 'https://customer-assets.emergentagent.com/job_dice-point-chase/artifacts/epbjxtqc_Dice%20Roll%201%20.mp3';
const CURSED_URL = 'https://customer-assets.emergentagent.com/job_dice-point-chase/artifacts/xz5kwlz0_Cursed%20Music%20.mp3';
const VICTORY_URL = 'https://customer-assets.emergentagent.com/job_dice-point-chase/artifacts/8wi7vx3x_Victory%20Music%20.mp3';

// Local SFX
const SFX_SCORE = require('../assets/audio/score.wav');
const SFX_SELECT = require('../assets/audio/select.wav');

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playTitleMusic: () => void;
  playIngameMusic: () => void;
  stopAllMusic: () => void;
  sfxRoll: () => void;
  sfxScore: () => void;
  sfxCursed: () => void;
  sfxVictory: () => void;
  sfxSelect: () => void;
}

const AudioContext = createContext<AudioContextType>({
  isMuted: false,
  toggleMute: () => {},
  playTitleMusic: () => {},
  playIngameMusic: () => {},
  stopAllMusic: () => {},
  sfxRoll: () => {},
  sfxScore: () => {},
  sfxCursed: () => {},
  sfxVictory: () => {},
  sfxSelect: () => {},
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [activeTrack, setActiveTrack] = useState<'title' | 'ingame' | 'none'>('none');

  // Music players
  const titlePlayer = useAudioPlayer(TITLE_MUSIC_URL);
  const ingamePlayer = useAudioPlayer(INGAME_MUSIC_URL);

  // SFX players
  const rollPlayer = useAudioPlayer(DICE_ROLL_URL);
  const cursedPlayer = useAudioPlayer(CURSED_URL);
  const victoryPlayer = useAudioPlayer(VICTORY_URL);
  const scorePlayer = useAudioPlayer(SFX_SCORE);
  const selectPlayer = useAudioPlayer(SFX_SELECT);

  // Load mute preference
  useEffect(() => {
    AsyncStorage.getItem(MUTE_KEY).then(val => {
      setIsMuted(val === 'true');
    }).catch(() => {});
  }, []);

  // Control title music
  useEffect(() => {
    if (!titlePlayer) return;
    titlePlayer.loop = true;
    titlePlayer.volume = 0.4;
    if (activeTrack === 'title' && !isMuted) {
      titlePlayer.play();
    } else {
      titlePlayer.pause();
    }
  }, [activeTrack, isMuted, titlePlayer]);

  // Control ingame music
  useEffect(() => {
    if (!ingamePlayer) return;
    ingamePlayer.loop = true;
    ingamePlayer.volume = 0.35;
    if (activeTrack === 'ingame' && !isMuted) {
      ingamePlayer.play();
    } else {
      ingamePlayer.pause();
    }
  }, [activeTrack, isMuted, ingamePlayer]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    AsyncStorage.setItem(MUTE_KEY, newMuted ? 'true' : 'false').catch(() => {});
  };

  const playTitleMusic = () => {
    if (ingamePlayer) ingamePlayer.pause();
    setActiveTrack('title');
  };

  const playIngameMusic = () => {
    if (titlePlayer) titlePlayer.pause();
    setActiveTrack('ingame');
  };

  const stopAllMusic = () => {
    setActiveTrack('none');
    if (titlePlayer) titlePlayer.pause();
    if (ingamePlayer) ingamePlayer.pause();
  };

  // SFX helpers
  const playSfx = (player: any) => {
    if (isMuted || !player) return;
    try {
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.log('SFX error:', e);
    }
  };

  const sfxRoll = () => playSfx(rollPlayer);
  const sfxScore = () => playSfx(scorePlayer);
  const sfxCursed = () => playSfx(cursedPlayer);
  const sfxVictory = () => playSfx(victoryPlayer);
  const sfxSelect = () => playSfx(selectPlayer);

  return (
    <AudioContext.Provider value={{
      isMuted, toggleMute,
      playTitleMusic, playIngameMusic, stopAllMusic,
      sfxRoll, sfxScore, sfxCursed, sfxVictory, sfxSelect,
    }}>
      {children}
    </AudioContext.Provider>
  );
};
