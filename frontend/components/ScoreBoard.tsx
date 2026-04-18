import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Player, WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS } from '../store/gameStore';
import { T, PLAYER_COLORS } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface ScoreBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  winMode: WinMode;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, currentPlayerIndex, winMode }) => {
  const threshold = WIN_THRESHOLDS[winMode];
  const isCompact = players.length > 3;

  return (
    <View style={s.container}>
      <View style={s.modeTag}>
        <Ionicons name="shield" size={12} color={T.gold} />
        <Text style={s.modeTagText}>{WIN_MODE_LABELS[winMode]} — {threshold} gold</Text>
      </View>
      <ScrollView horizontal={isCompact} showsHorizontalScrollIndicator={false} contentContainerStyle={isCompact ? s.scrollRow : s.gridRow}>
        {players.map((player, index) => {
          const isActive = currentPlayerIndex === index;
          const progress = Math.min((player.totalScore / threshold) * 100, 100);
          const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
          return (
            <View key={index} style={[s.playerCard, isActive && { borderColor: color }]}>
              {isActive && <View style={[s.turnBadge, { backgroundColor: color }]}><Ionicons name="flag" size={8} color="#fff" /><Text style={s.turnBadgeText}> TURN</Text></View>}
              <Ionicons name="shield" size={14} color={color} />
              <Text style={[s.playerName, isActive && { color: T.textPrimary }]} numberOfLines={1}>{player.name}</Text>
              <Text style={s.totalScore}>{player.totalScore}</Text>
              {player.currentTurnScore > 0 && (
                <View style={s.turnScoreBox}><Text style={s.turnScoreText}>+{player.currentTurnScore}</Text></View>
              )}
              <View style={s.progressBar}><View style={[s.progressFill, { width: `${progress}%`, backgroundColor: color }]} /></View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingTop: 8 },
  modeTag: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 4, backgroundColor: T.wood, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: T.gold },
  modeTagText: { color: T.gold, fontSize: 11, fontWeight: '700' },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scrollRow: { flexDirection: 'row', gap: 6, paddingRight: 8 },
  playerCard: { flex: 1, minWidth: 90, backgroundColor: T.bgSecondary, borderRadius: 12, padding: 10, borderWidth: 2, borderColor: T.woodLight, alignItems: 'center' },
  turnBadge: { position: 'absolute', top: -9, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 1, borderRadius: 6 },
  turnBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  playerName: { fontSize: 12, fontWeight: '700', color: T.textSecondary, marginTop: 4 },
  totalScore: { fontSize: 24, fontWeight: '800', color: T.gold, marginVertical: 2 },
  turnScoreBox: { backgroundColor: `${T.candlelight}20`, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: T.candlelight },
  turnScoreText: { fontSize: 13, fontWeight: '700', color: T.candlelight },
  progressBar: { width: '100%', height: 4, backgroundColor: T.woodLight, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
});
