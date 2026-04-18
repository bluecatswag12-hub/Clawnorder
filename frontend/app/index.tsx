import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore, WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS } from '../store/gameStore';
import { Ionicons } from '@expo/vector-icons';
import { playBgMusic, loadMutePreference, getIsMuted, setMuted } from '../utils/audioManager';

const WIN_MODES: WinMode[] = ['noobs', 'ogs', 'panthers'];
const WIN_COLORS: Record<WinMode, string> = { noobs: '#4CAF50', ogs: '#2196F3', panthers: '#e91e63' };
const WIN_ICONS: Record<WinMode, string> = { noobs: 'happy', ogs: 'flame', panthers: 'trophy' };

export default function Index() {
  const { setWinMode, winMode } = useGameStore();
  const [muted, setMutedState] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);

  useEffect(() => {
    loadMutePreference().then(() => {
      setMutedState(getIsMuted());
      // Try to play — will work on native, may be blocked on web until interaction
      if (!getIsMuted()) playBgMusic().then(() => setMusicStarted(true)).catch(() => {});
    });
  }, []);

  // On web, browsers block autoplay. This ensures music starts on first tap anywhere
  const ensureMusic = () => {
    if (!musicStarted && !muted) {
      playBgMusic().then(() => setMusicStarted(true)).catch(() => {});
    }
  };

  const toggleMute = async () => {
    const newVal = !muted;
    setMutedState(newVal);
    await setMuted(newVal);
    if (!newVal) {
      playBgMusic().then(() => setMusicStarted(true));
    } else {
      setMusicStarted(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={ensureMusic}
        onTouchStart={ensureMusic}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ width: 44 }} />
            <View style={styles.logoRow}>
              <Ionicons name="cube" size={32} color="#e91e63" />
              <Ionicons name="cube" size={32} color="#2196F3" />
              <Ionicons name="cube" size={32} color="#4CAF50" />
            </View>
            <Pressable testID="mute-btn" onPress={toggleMute} style={styles.muteBtn}>
              <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={24} color={muted ? '#555' : '#fff'} />
            </Pressable>
          </View>
          <Text style={styles.title}>CLAW & ORDER</Text>
          <Text style={styles.subtitle}>Dice Unit</Text>
        </View>

        {/* Game Mode Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Score Target</Text>
          <View style={styles.modeRow}>
            {WIN_MODES.map((mode) => (
              <Pressable
                key={mode}
                testID={`mode-${mode}`}
                style={[
                  styles.modeCard,
                  winMode === mode && { borderColor: WIN_COLORS[mode], backgroundColor: `${WIN_COLORS[mode]}18` },
                ]}
                onPress={() => setWinMode(mode)}
              >
                <Ionicons name={WIN_ICONS[mode] as any} size={22} color={winMode === mode ? WIN_COLORS[mode] : '#555'} />
                <Text style={[styles.modeName, winMode === mode && { color: WIN_COLORS[mode] }]}>{WIN_MODE_LABELS[mode]}</Text>
                <Text style={[styles.modeScore, winMode === mode && { color: WIN_COLORS[mode] }]}>{WIN_THRESHOLDS[mode]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable
            testID="local-game-btn"
            style={[styles.gameBtn, { backgroundColor: WIN_COLORS[winMode] }]}
            onPress={() => router.push('/local-setup')}
          >
            <Ionicons name="people" size={26} color="#fff" />
            <View style={styles.btnTextCol}>
              <Text style={styles.btnTitle}>Local Game</Text>
              <Text style={styles.btnSub}>2-5 players, same device</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
          </Pressable>

          <Pressable
            testID="online-game-btn"
            style={[styles.gameBtn, { backgroundColor: '#333' }]}
            onPress={() => router.push('/online-lobby')}
          >
            <Ionicons name="globe" size={26} color="#fff" />
            <View style={styles.btnTextCol}>
              <Text style={styles.btnTitle}>Online Game</Text>
              <Text style={styles.btnSub}>Up to 5 players, room codes</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
          </Pressable>

          <Pressable
            testID="rules-btn"
            style={[styles.gameBtn, { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#ff9800' }]}
            onPress={() => router.push('/rules')}
          >
            <Ionicons name="book" size={26} color="#ff9800" />
            <View style={styles.btnTextCol}>
              <Text style={styles.btnTitle}>Rules</Text>
              <Text style={[styles.btnSub, { color: '#ff9800' }]}>Scoring & how to play</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ff980066" />
          </Pressable>

          <Pressable
            testID="leaderboard-btn"
            style={[styles.gameBtn, { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#e91e63' }]}
            onPress={() => router.push('/leaderboard')}
          >
            <Ionicons name="trophy" size={26} color="#e91e63" />
            <View style={styles.btnTextCol}>
              <Text style={styles.btnTitle}>Leaderboard</Text>
              <Text style={[styles.btnSub, { color: '#e91e63' }]}>Daily & All-Time</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#e91e6366" />
          </Pressable>

          <Pressable
            testID="dice-shop-btn"
            style={[styles.gameBtn, { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#80F2DD' }]}
            onPress={() => router.push('/dice-shop')}
          >
            <Ionicons name="color-palette" size={26} color="#80F2DD" />
            <View style={styles.btnTextCol}>
              <Text style={styles.btnTitle}>Dice Shop</Text>
              <Text style={[styles.btnSub, { color: '#80F2DD' }]}>Unlockable colorways</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#80F2DD66" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 16, marginBottom: 28 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  muteBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#161625', borderRadius: 22, borderWidth: 1, borderColor: '#333' },
  logoRow: { flexDirection: 'row', gap: 8 },
  title: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  subtitle: { fontSize: 18, color: '#666', fontWeight: '600', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeCard: { flex: 1, backgroundColor: '#161625', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: '#222' },
  modeName: { fontSize: 12, fontWeight: '700', color: '#666', marginTop: 6 },
  modeScore: { fontSize: 17, fontWeight: '800', color: '#444', marginTop: 2 },
  buttonsContainer: { gap: 12 },
  gameBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, gap: 14 },
  btnTextCol: { flex: 1 },
  btnTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  btnSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
});
