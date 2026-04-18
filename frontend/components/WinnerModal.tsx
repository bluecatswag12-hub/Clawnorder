import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS, Player } from '../store/gameStore';
import { T, PLAYER_COLORS } from '../utils/theme';

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
    const scores = sorted.map((p, i) => `${i === 0 ? '👑' : '⚔️'} ${p.name}: ${p.totalScore} gold`).join('\n');
    const message = `🎲 CLAW & ORDER: DICE UNIT 🎲\n\n👑 ${winnerName} claims victory in ${modeName} mode!\n\n${scores}\n\nTarget: ${threshold} gold\nDare you challenge the champion? ⚔️`;
    try { await Share.share({ message, title: 'Claw & Order: Dice Unit' }); } catch (e) {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onBackToMenu}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <View style={s.crownRing}><Ionicons name="ribbon" size={50} color={T.gold} /></View>
          <Text style={s.winTitle}>VICTORY!</Text>
          <Text style={s.winnerName}>{winnerName}</Text>

          <View style={s.scoreBox}>
            {sorted.map((player, i) => (
              <View key={i} style={s.scoreRow}>
                <View style={s.scoreLeft}>
                  <Ionicons name="shield" size={14} color={PLAYER_COLORS[players.indexOf(player) % PLAYER_COLORS.length]} />
                  <Text style={s.scoreLabel}>{player.name}</Text>
                </View>
                <Text style={[s.scoreValue, player.name === winnerName && s.winnerScore]}>{player.totalScore}</Text>
              </View>
            ))}
          </View>

          <Text style={s.modeTag}>{modeName} — {threshold} gold</Text>

          <Pressable testID="share-btn" style={s.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={T.bgPrimary} />
            <Text style={s.shareBtnText}>Challenge a Rival</Text>
          </Pressable>

          <View style={s.actions}>
            <Pressable testID="play-again-btn" style={[s.actionBtn, { backgroundColor: T.emerald }]} onPress={onPlayAgain}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={s.actionText}>Play Again</Text>
            </Pressable>
            <Pressable testID="leaderboard-btn-modal" style={[s.actionBtn, { backgroundColor: T.crimson }]} onPress={onViewLeaderboard}>
              <Ionicons name="trophy" size={18} color="#fff" />
              <Text style={s.actionText}>Champions</Text>
            </Pressable>
          </View>

          <Pressable testID="menu-btn" style={s.menuLink} onPress={onBackToMenu}>
            <Text style={s.menuLinkText}>Return to Tavern</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: T.bgSecondary, borderRadius: 20, padding: 24, alignItems: 'center', width: '88%', maxWidth: 400, borderWidth: 2, borderColor: T.gold },
  crownRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${T.gold}15`, borderWidth: 3, borderColor: T.gold, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  winTitle: { fontSize: 28, fontWeight: '900', color: T.gold, letterSpacing: 4 },
  winnerName: { fontSize: 22, fontWeight: '700', color: T.textPrimary, marginTop: 4, marginBottom: 14 },
  scoreBox: { width: '100%', backgroundColor: T.bgPrimary, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: T.woodLight },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  scoreLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreLabel: { fontSize: 14, color: T.textSecondary, fontWeight: '600' },
  scoreValue: { fontSize: 18, fontWeight: '800', color: T.woodLight },
  winnerScore: { color: T.gold },
  modeTag: { fontSize: 12, color: T.candlelight, fontWeight: '700', marginBottom: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: T.gold, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, gap: 8, width: '100%', marginBottom: 10 },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: T.bgPrimary },
  actions: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 12, gap: 6 },
  actionText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  menuLink: { paddingVertical: 8 },
  menuLinkText: { fontSize: 13, color: T.textSecondary, fontWeight: '600' },
});
