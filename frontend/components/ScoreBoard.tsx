import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player, WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS } from '../store/gameStore';

interface ScoreBoardProps {
  players: [Player, Player];
  currentPlayerIndex: number;
  winMode: WinMode;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  currentPlayerIndex,
  winMode,
}) => {
  const threshold = WIN_THRESHOLDS[winMode];

  return (
    <View style={styles.container}>
      <View style={styles.modeTag}>
        <Text style={styles.modeTagText}>{WIN_MODE_LABELS[winMode]} Mode — {threshold} pts</Text>
      </View>
      <View style={styles.playersRow}>
        {players.map((player, index) => {
          const isActive = currentPlayerIndex === index;
          const progress = Math.min((player.totalScore / threshold) * 100, 100);
          return (
            <View
              key={index}
              style={[styles.playerCard, isActive && styles.activeCard]}
            >
              {isActive && (
                <View style={styles.turnBadge}>
                  <Text style={styles.turnBadgeText}>TURN</Text>
                </View>
              )}
              <Text style={[styles.playerName, isActive && styles.activeName]} numberOfLines={1}>
                {player.name}
              </Text>
              <Text style={styles.totalScore}>{player.totalScore}</Text>
              {player.currentTurnScore > 0 && (
                <View style={styles.turnScoreBox}>
                  <Text style={styles.turnScoreText}>+{player.currentTurnScore}</Text>
                </View>
              )}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.remainText}>{Math.max(threshold - player.totalScore, 0)} left</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  modeTag: {
    alignSelf: 'center',
    backgroundColor: '#e91e63',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  modeTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  playersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  playerCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: '#2a3f5f',
    alignItems: 'center',
  },
  activeCard: {
    borderColor: '#2196F3',
    backgroundColor: '#1a2d4e',
  },
  turnBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  turnBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#aaa',
    marginTop: 4,
  },
  activeName: {
    color: '#fff',
  },
  totalScore: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginVertical: 4,
  },
  turnScoreBox: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  turnScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff9800',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#2a3f5f',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  remainText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
});
