import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore, WIN_MODE_LABELS, WIN_THRESHOLDS } from '../store/gameStore';
import { Ionicons } from '@expo/vector-icons';

export default function OnlineLobby() {
  const { players, winMode } = useGameStore();

  const handleBackToMenu = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToMenu} style={styles.backButton} testID="back-btn">
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Online Lobby</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.comingSoonBox}>
          <Ionicons name="globe" size={64} color="#2196F3" />
          <Text style={styles.comingSoonTitle}>Online Multiplayer</Text>
          <Text style={styles.comingSoonText}>
            Coming soon! For now, enjoy the local multiplayer mode with both players on the same device.
          </Text>
          <Text style={styles.modeInfo}>
            Current mode: {WIN_MODE_LABELS[winMode]} ({WIN_THRESHOLDS[winMode]} pts)
          </Text>

          <TouchableOpacity
            testID="play-local-btn"
            style={styles.localBtn}
            onPress={() => {
              router.replace('/game');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="people" size={24} color="#fff" />
            <Text style={styles.localBtnText}>Play Local Instead</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="back-menu-btn"
            style={styles.menuBtn}
            onPress={handleBackToMenu}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={24} color="#fff" />
            <Text style={styles.menuBtnText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111122',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  comingSoonBox: {
    backgroundColor: '#161625',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  modeInfo: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 24,
  },
  localBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  localBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    width: '100%',
  },
  menuBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
