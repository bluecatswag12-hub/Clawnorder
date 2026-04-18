import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Player, WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS } from '../store/gameStore';

const PLAYER_COLORS = ['#2196F3', '#e91e63', '#4CAF50', '#ff9800', '#9C27B0'];

interface ScoreBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  winMode: WinMode;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, currentPlayerIndex, winMode }) => {
  const threshold = WIN_THRESHOLDS[winMode];
  const isCompact = players.length > 3;

  return (
    <View style={styles.container}>
      <View style={styles.modeTag}>
        <Text style={styles.modeTagText}>{WIN_MODE_LABELS[winMode]} — {threshold} pts</Text>
      </View>
      <ScrollView horizontal={isCompact} showsHorizontalScrollIndicator={false} contentContainerStyle={isCompact ? styles.scrollRow : styles.gridRow}>
        {players.map((player, index) => {
          const isActive = currentPlayerIndex === index;
          const progress = Math.min((player.totalScore / threshold) * 100, 100);
          const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
          return (
            <View key={index} style={[styles.playerCard, isActive && { borderColor: color, backgroundColor: `${color}12` }, isCompact && styles.compactCard]}>
              {isActive && <View style={[styles.turnBadge, { backgroundColor: color }]}><Text style={styles.turnBadgeText}>TURN</Text></View>}
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <Text style={[styles.playerName, isActive && { color: '#fff' }]} numberOfLines={1}>{player.name}</Text>
              <Text style={styles.totalScore}>{player.totalScore}</Text>
              {player.currentTurnScore > 0 && (
                <View style={styles.turnScoreBox}><Text style={styles.turnScoreText}>+{player.currentTurnScore}</Text></View>
              )}
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} /></View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingTop: 8 },
  modeTag: { alignSelf: 'center', backgroundColor: '#e91e63', paddingHorizontal: 14, paddingVertical: 3, borderRadius: 10, marginBottom: 8 },
  modeTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scrollRow: { flexDirection: 'row', gap: 6, paddingRight: 8 },
  playerCard: { flex: 1, minWidth: 90, backgroundColor: '#16213e', borderRadius: 12, padding: 10, borderWidth: 2, borderColor: '#2a3f5f', alignItems: 'center' },
  compactCard: { flex: 0, width: 110 },
  turnBadge: { position: 'absolute', top: -9, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 6 },
  turnBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  playerName: { fontSize: 12, fontWeight: '700', color: '#888', marginTop: 4 },
  totalScore: { fontSize: 24, fontWeight: '800', color: '#fff', marginVertical: 2 },
  turnScoreBox: { backgroundColor: 'rgba(255,152,0,0.2)', paddingHorizontal: 8, paddingVertical: 1, borderRadius: 6, borderWidth: 1, borderColor: '#ff9800' },
  turnScoreText: { fontSize: 13, fontWeight: '700', color: '#ff9800' },
  progressBar: { width: '100%', height: 4, backgroundColor: '#2a3f5f', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
});
