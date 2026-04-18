import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useGameStore, WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS } from '../store/gameStore';
import { Ionicons } from '@expo/vector-icons';
import { useAudio } from '../utils/AudioProvider';
import { T, WIN_COLORS, WIN_ICONS } from '../utils/theme';

const WIN_MODES: WinMode[] = ['noobs', 'ogs', 'panthers'];

export default function Index() {
  const { setWinMode, winMode } = useGameStore();
  const { isMuted, toggleMute, playTitleMusic } = useAudio();

  useEffect(() => { playTitleMusic(); }, []);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={{ width: 44 }} />
            <View style={s.crest}>
              <Ionicons name="shield" size={28} color={T.gold} />
            </View>
            <Pressable testID="mute-btn" onPress={toggleMute} style={s.muteBtn}>
              <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={22} color={isMuted ? T.silver : T.gold} />
            </Pressable>
          </View>
          <Text style={s.title}>CLAW & ORDER</Text>
          <Text style={s.subtitle}>Dice Unit</Text>
          <View style={s.divider}><View style={s.dividerLine} /><Ionicons name="diamond" size={10} color={T.gold} /><View style={s.dividerLine} /></View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Choose Thy Challenge</Text>
          <View style={s.modeRow}>
            {WIN_MODES.map((mode) => (
              <Pressable key={mode} testID={`mode-${mode}`} style={[s.modeCard, winMode === mode && { borderColor: WIN_COLORS[mode], backgroundColor: `${WIN_COLORS[mode]}20` }]} onPress={() => setWinMode(mode)}>
                <Ionicons name={WIN_ICONS[mode] as any} size={20} color={winMode === mode ? WIN_COLORS[mode] : T.silver} />
                <Text style={[s.modeName, winMode === mode && { color: WIN_COLORS[mode] }]}>{WIN_MODE_LABELS[mode]}</Text>
                <Text style={[s.modeScore, winMode === mode && { color: WIN_COLORS[mode] }]}>{WIN_THRESHOLDS[mode]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.buttons}>
          <Pressable testID="local-game-btn" style={[s.btn, { borderColor: T.candlelight }]} onPress={() => router.push('/local-setup')}>
            <Ionicons name="people" size={24} color={T.candlelight} />
            <View style={s.btnCol}><Text style={[s.btnTitle, { color: T.candlelight }]}>Local Tavern</Text><Text style={s.btnSub}>2-5 players, same device</Text></View>
            <Ionicons name="chevron-forward" size={20} color={T.woodLight} />
          </Pressable>

          <Pressable testID="online-game-btn" style={[s.btn, { borderColor: T.gold }]} onPress={() => router.push('/online-lobby')}>
            <Ionicons name="globe" size={24} color={T.gold} />
            <View style={s.btnCol}><Text style={[s.btnTitle, { color: T.gold }]}>Online Realm</Text><Text style={s.btnSub}>Up to 5 players, room codes</Text></View>
            <Ionicons name="chevron-forward" size={20} color={T.woodLight} />
          </Pressable>

          <Pressable testID="server-browser-btn" style={[s.btn, { borderColor: T.emerald }]} onPress={() => router.push('/server-browser')}>
            <Ionicons name="server" size={24} color={T.emerald} />
            <View style={s.btnCol}><Text style={[s.btnTitle, { color: T.emerald }]}>Local Server</Text><Text style={s.btnSub}>Browse hosted taverns</Text></View>
            <Ionicons name="chevron-forward" size={20} color={T.woodLight} />
          </Pressable>

          <Pressable testID="rules-btn" style={[s.btn, { borderColor: T.parchmentDark }]} onPress={() => router.push('/rules')}>
            <Ionicons name="scroll" size={24} color={T.parchment} />
            <View style={s.btnCol}><Text style={[s.btnTitle, { color: T.parchment }]}>The Scrolls</Text><Text style={s.btnSub}>Rules of the realm</Text></View>
            <Ionicons name="chevron-forward" size={20} color={T.woodLight} />
          </Pressable>

          <Pressable testID="leaderboard-btn" style={[s.btn, { borderColor: T.crimsonLight }]} onPress={() => router.push('/leaderboard')}>
            <Ionicons name="trophy" size={24} color={T.crimsonLight} />
            <View style={s.btnCol}><Text style={[s.btnTitle, { color: T.crimsonLight }]}>Hall of Champions</Text><Text style={s.btnSub}>Daily & All-Time</Text></View>
            <Ionicons name="chevron-forward" size={20} color={T.woodLight} />
          </Pressable>

          <Pressable testID="dice-shop-btn" style={[s.btn, { borderColor: '#80F2DD' }]} onPress={() => router.push('/dice-shop')}>
            <Ionicons name="color-palette" size={24} color="#80F2DD" />
            <View style={s.btnCol}><Text style={[s.btnTitle, { color: '#80F2DD' }]}>The Armoury</Text><Text style={[s.btnSub, { color: '#80F2DD88' }]}>Unlockable dice</Text></View>
            <Ionicons name="chevron-forward" size={20} color={T.woodLight} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bgPrimary },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 12 },
  crest: { width: 48, height: 48, borderRadius: 24, backgroundColor: T.wood, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: T.gold },
  muteBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: T.wood, borderRadius: 22, borderWidth: 1, borderColor: T.woodLight },
  title: { fontSize: 34, fontWeight: '900', color: T.gold, letterSpacing: 3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  subtitle: { fontSize: 16, color: T.textSecondary, fontWeight: '600', marginTop: 2, letterSpacing: 4, textTransform: 'uppercase' },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  dividerLine: { width: 40, height: 1, backgroundColor: T.gold },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: T.textSecondary, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeCard: { flex: 1, backgroundColor: T.wood, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: T.woodLight },
  modeName: { fontSize: 11, fontWeight: '700', color: T.silver, marginTop: 4 },
  modeScore: { fontSize: 16, fontWeight: '800', color: T.woodLight, marginTop: 2 },
  buttons: { gap: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12, backgroundColor: T.bgSecondary, borderWidth: 1.5 },
  btnCol: { flex: 1 },
  btnTitle: { fontSize: 16, fontWeight: '700' },
  btnSub: { fontSize: 11, color: T.textSecondary, marginTop: 2 },
});
