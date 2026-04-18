import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../utils/api';

const STORAGE_KEY = '@dice_unlocks';
const MILESTONES_KEY = '@dice_milestones';

export interface DiceColorway {
  id: string;
  name: string;
  faceColor: string;
  dotColor: string;
  borderColor: string;
  locked: boolean;
  unlockCondition?: string;
  unlockIcon?: string;
}

export const ALL_COLORWAYS: DiceColorway[] = [
  { id: 'classic', name: 'Classic Ivory', faceColor: '#F4E3C5fff', dotColor: '#3D2B1F222', borderColor: '#3D2B1F333', locked: false },
  { id: 'midnight', name: 'Midnight Ember', faceColor: '#1a1a2e', dotColor: '#ff5722', borderColor: '#ff5722', locked: true, unlockCondition: 'Win your first game', unlockIcon: 'trophy' },
  { id: 'ocean', name: 'Blue Buzz', faceColor: '#0d47a1', dotColor: '#e3f2fd', borderColor: '#42a5f5', locked: true, unlockCondition: 'Score a Hot Hand', unlockIcon: 'flame' },
  { id: 'toxic', name: 'Toxic Lime', faceColor: '#1b1b1b', dotColor: '#76ff03', borderColor: '#76ff03', locked: true, unlockCondition: 'Roll a full straight 123456', unlockIcon: 'dice' },
  { id: 'aqua', name: 'The Panther', faceColor: '#1A110A', dotColor: '#80F2DD', borderColor: '#80F2DD', locked: true, unlockCondition: 'Play 5 games in 24 hours', unlockIcon: 'paw' },
];

// Milestone keys stored in AsyncStorage
// @milestone_first_win, @milestone_first_hothand, @milestone_first_straight
// @dice_unlocks = ["midnight", "ocean", ...] 

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

async function getMilestones(): Promise<Record<string, boolean>> {
  try {
    const data = await AsyncStorage.getItem(MILESTONES_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

async function getSelectedColorway(): Promise<string> {
  try { return (await AsyncStorage.getItem('@dice_selected')) || 'classic'; } catch { return 'classic'; }
}

async function setSelectedColorway(id: string) {
  try { await AsyncStorage.setItem('@dice_selected', id); } catch {}
}

// Exported so game.tsx can call these on milestones
export async function recordMilestone(key: string) {
  try {
    const milestones = await getMilestones();
    milestones[key] = true;
    await AsyncStorage.setItem(MILESTONES_KEY, JSON.stringify(milestones));

    // Auto-unlock corresponding dice
    if (key === 'first_win') await saveUnlock('midnight');
    if (key === 'first_hothand') await saveUnlock('ocean');
    if (key === 'first_straight') await saveUnlock('toxic');
  } catch {}
}

export default function DiceShop() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [checking, setChecking] = useState(false);

  const loadData = useCallback(async () => {
    const [u, s, m] = await Promise.all([getUnlocks(), getSelectedColorway(), getMilestones()]);
    setUnlocked(u);
    setSelected(s);
    setMilestones(m);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const checkPantherUnlock = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/leaderboard/daily`);
      const data = await res.json();
      const total = data.total_games_today || 0;
      setGamesPlayed(total);
      if (total >= 5) {
        await saveUnlock('aqua');
        setUnlocked(prev => prev.includes('aqua') ? prev : [...prev, 'aqua']);
      }
    } catch {}
    setChecking(false);
  };

  useEffect(() => { checkPantherUnlock(); }, []);

  const handleSelect = async (cw: DiceColorway) => {
    const isAvailable = !cw.locked || unlocked.includes(cw.id);
    if (!isAvailable) return;
    setSelected(cw.id);
    await setSelectedColorway(cw.id);
  };

  const getProgressText = (cw: DiceColorway): string | null => {
    if (cw.id === 'midnight') return milestones.first_win ? null : 'Not yet won';
    if (cw.id === 'ocean') return milestones.first_hothand ? null : 'No Hot Hand yet';
    if (cw.id === 'toxic') return milestones.first_straight ? null : 'No 123456 yet';
    if (cw.id === 'aqua') return gamesPlayed >= 5 ? null : `${gamesPlayed}/5 games today`;
    return null;
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.loadingBox}><ActivityIndicator size="large" color="#80F2DD" /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} testID="back-btn">
          <Ionicons name="arrow-back" size={26} color="#F4E3C5" />
        </Pressable>
        <Text style={styles.headerTitle}>DICE SHOP</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSubtitle}>Equip your dice before battle</Text>

        {ALL_COLORWAYS.map((cw) => {
          const isAvailable = !cw.locked || unlocked.includes(cw.id);
          const isSelected = selected === cw.id;
          const progress = getProgressText(cw);

          return (
            <Pressable
              key={cw.id}
              testID={`dice-${cw.id}`}
              style={[styles.card, isSelected && { borderColor: cw.borderColor }, !isAvailable && styles.lockedCard]}
              onPress={() => handleSelect(cw)}
              disabled={!isAvailable}
            >
              {/* Dice Preview - 3 filled dice showing 1, 4, 6 */}
              <View style={styles.previewRow}>
                {[1, 4, 6].map((val) => (
                  <DicePreview key={val} value={val} face={cw.faceColor} dot={cw.dotColor} border={isSelected ? cw.borderColor : cw.borderColor} />
                ))}
              </View>

              <View style={styles.infoCol}>
                <View style={styles.nameRow}>
                  <Text style={[styles.colorName, !isAvailable && styles.lockedText]}>{cw.name}</Text>
                  {isSelected && <View style={[styles.equippedBadge, { backgroundColor: cw.borderColor }]}><Text style={styles.equippedText}>EQUIPPED</Text></View>}
                </View>

                {!isAvailable && (
                  <View style={styles.lockRow}>
                    <Ionicons name={(cw.unlockIcon || 'lock-closed') as any} size={14} color="#FF9E3D" />
                    <Text style={styles.lockText}>{cw.unlockCondition}</Text>
                    {progress && <Text style={styles.progressText}>({progress})</Text>}
                  </View>
                )}

                {isAvailable && !cw.locked && <Text style={styles.freeText}>Default</Text>}

                {isAvailable && cw.locked && (
                  <View style={styles.unlockedRow}>
                    <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                    <Text style={styles.unlockedText}>Unlocked forever!</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}

        {!unlocked.includes('aqua') && (
          <Pressable style={styles.refreshBtn} onPress={checkPantherUnlock} disabled={checking}>
            {checking ? <ActivityIndicator color="#F4E3C5" size="small" /> : (
              <><Ionicons name="refresh" size={18} color="#F4E3C5" /><Text style={styles.refreshText}>Check Unlock Progress</Text></>
            )}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Proper dice face component with correct dot placement
function DicePreview({ value, face, dot, border }: { value: number; face: string; dot: string; border: string }) {
  const s = 44;
  const d = 7;
  const positions: Record<number, Array<{ top: number; left: number }>> = {
    1: [{ top: s / 2 - d / 2, left: s / 2 - d / 2 }],
    2: [{ top: 8, left: s - 8 - d }, { top: s - 8 - d, left: 8 }],
    3: [{ top: 8, left: s - 8 - d }, { top: s / 2 - d / 2, left: s / 2 - d / 2 }, { top: s - 8 - d, left: 8 }],
    4: [{ top: 8, left: 8 }, { top: 8, left: s - 8 - d }, { top: s - 8 - d, left: 8 }, { top: s - 8 - d, left: s - 8 - d }],
    5: [{ top: 8, left: 8 }, { top: 8, left: s - 8 - d }, { top: s / 2 - d / 2, left: s / 2 - d / 2 }, { top: s - 8 - d, left: 8 }, { top: s - 8 - d, left: s - 8 - d }],
    6: [{ top: 8, left: 8 }, { top: s / 2 - d / 2, left: 8 }, { top: s - 8 - d, left: 8 }, { top: 8, left: s - 8 - d }, { top: s / 2 - d / 2, left: s - 8 - d }, { top: s - 8 - d, left: s - 8 - d }],
  };

  return (
    <View style={{ width: s, height: s, borderRadius: 8, backgroundColor: face, borderWidth: 2, borderColor: border, position: 'relative' }}>
      {(positions[value] || []).map((pos, i) => (
        <View key={i} style={{ position: 'absolute', top: pos.top, left: pos.left, width: d, height: d, borderRadius: d / 2, backgroundColor: dot }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A110A' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2C1E16', borderBottomWidth: 1, borderBottomColor: '#3D2B1F' },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#F4E3C5', letterSpacing: 2 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  pageSubtitle: { fontSize: 14, color: '#AA7C11', textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  card: { backgroundColor: '#2C1E16', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#3D2B1F' },
  lockedCard: { opacity: 0.55 },
  previewRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 14 },
  infoCol: {},
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  colorName: { fontSize: 18, fontWeight: '700', color: '#F4E3C5' },
  lockedText: { color: '#AA7C11' },
  equippedBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  equippedText: { color: '#F4E3C5', fontSize: 11, fontWeight: '800' },
  freeText: { fontSize: 12, color: '#C8AC70', marginTop: 4 },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  lockText: { fontSize: 12, color: '#FF9E3D', fontWeight: '600' },
  progressText: { fontSize: 11, color: '#AA7C11' },
  unlockedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  unlockedText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3D2B1F', paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 8 },
  refreshText: { fontSize: 14, fontWeight: '600', color: '#F4E3C5' },
});
