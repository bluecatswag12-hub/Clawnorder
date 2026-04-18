import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS, Player } from '../store/gameStore';

const PLAYER_COLORS = ['#2196F3', '#e91e63', '#4CAF50', '#ff9800', '#9C27B0'];

interface WinnerModalProps {
  visible: boolean;
  winnerName: string;
  winMode: WinMode;
  players: Player[];
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onViewLeaderboard: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  visible, winnerName, winMode, players, onPlayAgain, onBackToMenu, onViewLeaderboard,
}) => {
  const threshold = WIN_THRESHOLDS[winMode];
  const modeName = WIN_MODE_LABELS[winMode];
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);

  const handleShare = async () => {
    const scores = sorted.map((p, i) => `${i === 0 ? '🏆' : '  '} ${p.name}: ${p.totalScore} pts`).join('\n');
    const message = `🎲 CLAW & ORDER: DICE UNIT 🎲\n\n🏆 ${winnerName} wins in ${modeName} mode!\n\n${scores}\n\nTarget: ${threshold} pts\nChallenge your friends! 🔥`;
    try { await Share.share({ message, title: 'Claw & Order: Dice Unit' }); } catch (e) {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onBackToMenu}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.trophyRing}><Ionicons name="trophy" size={50} color="#FFD700" /></View>
          <Text style={styles.winTitle}>WINNER!</Text>
          <Text style={styles.winnerName}>{winnerName}</Text>

          <View style={styles.scoreBox}>
            {sorted.map((player, i) => (
              <View key={i} style={styles.scoreRow}>
                <View style={styles.scoreLeft}>
                  <View style={[styles.dot, { backgroundColor: PLAYER_COLORS[players.indexOf(player) % PLAYER_COLORS.length] }]} />
                  <Text style={styles.scoreLabel}>{player.name}</Text>
                </View>
                <Text style={[styles.scoreValue, player.name === winnerName && styles.winnerScore]}>{player.totalScore}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.modeTag}>{modeName} Mode — {threshold} pts</Text>

          <Pressable testID="share-btn" style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color="#fff" />
            <Text style={styles.shareBtnText}>Challenge a Friend</Text>
          </Pressable>

          <View style={styles.actions}>
            <Pressable testID="play-again-btn" style={[styles.actionBtn, styles.playAgainBtn]} onPress={onPlayAgain}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.actionText}>Play Again</Text>
            </Pressable>
            <Pressable testID="leaderboard-btn-modal" style={[styles.actionBtn, styles.leaderBtn]} onPress={onViewLeaderboard}>
              <Ionicons name="stats-chart" size={18} color="#fff" />
              <Text style={styles.actionText}>Leaderboard</Text>
            </Pressable>
          </View>

          <Pressable testID="menu-btn" style={styles.menuLink} onPress={onBackToMenu}>
            <Text style={styles.menuLinkText}>Back to Menu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#161625', borderRadius: 24, padding: 24, alignItems: 'center', width: '88%', maxWidth: 400, borderWidth: 1, borderColor: '#FFD70044' },
  trophyRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD70015', borderWidth: 3, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  winTitle: { fontSize: 28, fontWeight: '900', color: '#FFD700', letterSpacing: 4 },
  winnerName: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 4, marginBottom: 14 },
  scoreBox: { width: '100%', backgroundColor: '#0d0d1a', borderRadius: 14, padding: 12, marginBottom: 10 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  scoreLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  scoreLabel: { fontSize: 14, color: '#aaa', fontWeight: '600' },
  scoreValue: { fontSize: 18, fontWeight: '800', color: '#666' },
  winnerScore: { color: '#4CAF50' },
  modeTag: { fontSize: 12, color: '#e91e63', fontWeight: '700', marginBottom: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e91e63', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, gap: 8, width: '100%', marginBottom: 10 },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  actions: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 12, gap: 6 },
  playAgainBtn: { backgroundColor: '#4CAF50' },
  leaderBtn: { backgroundColor: '#2196F3' },
  actionText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  menuLink: { paddingVertical: 8 },
  menuLinkText: { fontSize: 13, color: '#666', fontWeight: '600' },
});
