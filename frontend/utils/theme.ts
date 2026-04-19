import { StyleSheet } from 'react-native';

// Medieval Dark Tavern Theme Colors
export const T = {
  bgPrimary: '#1A110A',
  bgSecondary: '#2C1E16',
  wood: '#3D2B1F',
  woodLight: '#5C3D2E',
  parchment: '#E8D3A2',
  parchmentDark: '#C8AC70',
  textPrimary: '#F4E3C5',
  textSecondary: '#AA7C11',
  textOnParchment: '#2C1E16',
  gold: '#D4AF37',
  candlelight: '#FF9E3D',
  crimson: '#8B0000',
  crimsonLight: '#B22222',
  emerald: '#2E7D32',
  silver: '#A0A0A0',
  bronze: '#CD7F32',
};

// Player colors - medieval themed
export const PLAYER_COLORS = ['#D4AF37', '#B22222', '#2E7D32', '#FF9E3D', '#7B1FA2'];

// Win mode colors
export const WIN_COLORS: Record<string, string> = {
  noobs: '#2E7D32',
  ogs: '#D4AF37',
  panthers: '#8B0000',
  royals: '#7B1FA2',
};

// Win mode icons
export const WIN_ICONS: Record<string, string> = {
  noobs: 'flag',
  ogs: 'shield',
  panthers: 'ribbon',
  royals: 'diamond',
};
