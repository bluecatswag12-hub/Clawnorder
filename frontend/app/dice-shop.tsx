import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../utils/api';

const STORAGE_KEY = '@dice_unlocks';

export interface DiceColorway {
  id: string;
  name: string;
  faceColor: string;
  dotColor: string;
  borderColor: string;
  locked: boolean;
  unlockCondition?: string;
}

export const ALL_COLORWAYS: DiceColorway[] = [
  { id: 'classic', name: 'Classic Ivory', faceColor: '#ffffff', dotColor: '#222222', borderColor: '#333333', locked: false },
  { id: 'midnight', name: 'Midnight Ember', faceColor: '#1a1a2e', dotColor: '#ff5722', borderColor: '#ff5722', locked: false },
  { id: 'ocean', name: 'Ocean Breeze', faceColor: '#0d47a1', dotColor: '#e3f2fd', borderColor: '#2196F3', locked: false },
  { id: 'toxic', name: 'Toxic Lime', faceColor: '#1b1b1b', dotColor: '#76ff03', borderColor: '#76ff03', locked: false },
  { id: 'aqua', name: 'Phantom Aqua', faceColor: '#0d0d1a', dotColor: '#80F2DD', borderColor: '#80F2DD', locked: true, unlockCondition: 'Play 5 games in 24 hours' },
];

async function getUnlocks(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function saveUnlock(id: string) {
  try {
    const current = await getUnlocks();
    if (!current.includes(id)) {
      current.push(id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  } catch {}
}

async function getSelectedColorway(): Promise<string> {
  try {
    const val = await AsyncStorage.getItem('@dice_selected');
    return val || 'classic';
  } catch { return 'classic'; }
}

async function setSelectedColorway(id: string) {
  try { await AsyncStorage.setItem('@dice_selected', id); } catch {}
}

export default function DiceShop() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [selected, setSelected] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [checking, setChecking] = useState(false);

  const loadData = useCallback(async () => {
    const [unlocksData, selectedData] = await Promise.all([getUnlocks(), getSelectedColorway()]);
    setUnlocked(unlocksData);
    setSelected(selectedData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const checkAquaUnlock = async () => {
    setChecking(true);
    try {
      // Check daily leaderboard for games played today
      const res = await fetch(`${BACKEND_URL}/api/leaderboard/daily`);
      const data = await res.json();
      // Sum all games from all players (rough check — in a real app you'd track per-device)
      const totalGames = data.total_games_today || 0;
      setGamesPlayed(totalGames);
      if (totalGames >= 5) {
        await saveUnlock('aqua');
        setUnlocked(prev => prev.includes('aqua') ? prev : [...prev, 'aqua']);
      }
    } catch {}
    setChecking(false);
  };

  useEffect(() => { checkAquaUnlock(); }, []);

  const handleSelect = async (cw: DiceColorway) => {
    const isUnlocked = !cw.locked || unlocked.includes(cw.id);
    if (!isUnlocked) return;
    setSelected(cw.id);
    await setSelectedColorway(cw.id);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}><ActivityIndicator size="large" color="#2196F3" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} testID="back-btn">
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>DICE SHOP</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSubtitle}>Choose your dice style before starting a game</Text>

        {ALL_COLORWAYS.map((cw) => {
          const isUnlocked = !cw.locked || unlocked.includes(cw.id);
          const isSelected = selected === cw.id;

          return (
            <Pressable
              key={cw.id}
              testID={`dice-${cw.id}`}
              style={[
                styles.card,
                isSelected && styles.selectedCard,
                !isUnlocked && styles.lockedCard,
              ]}
              onPress={() => handleSelect(cw)}
              disabled={!isUnlocked}
            >
              {/* Dice Preview */}
              <View style={styles.previewRow}>
                {[1, 3, 5].map((val) => (
                  <View key={val} style={[styles.dicePreview, { backgroundColor: cw.faceColor, borderColor: cw.borderColor }]}>  
                    {Array.from({ length: val }).map((_, di) => (
                      <View key={di} style={[styles.previewDot, { backgroundColor: cw.dotColor }]} />
                    ))}
                  </View>
                ))}
              </View>

              {/* Info */}
              <View style={styles.infoCol}>
                <View style={styles.nameRow}>
                  <Text style={[styles.colorName, !isUnlocked && styles.lockedText]}>{cw.name}</Text>
                  {isSelected && <View style={styles.equippedBadge}><Text style={styles.equippedText}>EQUIPPED</Text></View>}
                </View>

                {!isUnlocked && (
                  <View style={styles.lockRow}>
                    <Ionicons name="lock-closed" size={14} color="#ff9800" />
                    <Text style={styles.lockText}>{cw.unlockCondition}</Text>
                    <Text style={styles.progressText}>({gamesPlayed}/5 today)</Text>
                  </View>
                )}

                {isUnlocked && !cw.locked && (
                  <Text style={styles.freeText}>Free</Text>
                )}

                {isUnlocked && cw.locked && (
                  <View style={styles.unlockedRow}>
                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                    <Text style={styles.unlockedText}>Unlocked!</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}

        {!unlocked.includes('aqua') && (
          <Pressable style={styles.refreshBtn} onPress={checkAquaUnlock} disabled={checking}>
            {checking ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Ionicons name="refresh" size={18} color="#fff" /><Text style={styles.refreshText}>Check Unlock Progress</Text></>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111122', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  pageSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#161625', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#222' },
  selectedCard: { borderColor: '#4CAF50', backgroundColor: '#161625' },
  lockedCard: { opacity: 0.6 },
  previewRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 14 },
  dicePreview: { width: 44, height: 44, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 3, padding: 6 },
  previewDot: { width: 7, height: 7, borderRadius: 4 },
  infoCol: {},
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  colorName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  lockedText: { color: '#666' },
  equippedBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  equippedText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  freeText: { fontSize: 12, color: '#888', marginTop: 4 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  lockText: { fontSize: 12, color: '#ff9800', fontWeight: '600' },
  progressText: { fontSize: 12, color: '#888' },
  unlockedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  unlockedText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 8 },
  refreshText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
