import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS, Player } from '../store/gameStore';

const PLAYER_COLORS = ['#D4AF37', '#B22222', '#2E7D32', '#FF9E3D', '#7B1FA2'];

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
  if (!visible || !players || players.length === 0) return null;

  const threshold = WIN_THRESHOLDS[winMode] || 3000;
  const modeName = WIN_MODE_LABELS[winMode] || 'Knights';
  const sorted = [...players].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  const name = winnerName || 'Champion';

  const handleShare = async () => {
    try {
      const scores = sorted.map((p, i) => `${i === 0 ? '👑' : '⚔️'} ${p.name}: ${p.totalScore} gold`).join('\n');
      const message = `🎲 CLAW & ORDER: DICE UNIT 🎲\n\n👑 ${name} claims victory in ${modeName} mode!\n\n${scores}\n\nTarget: ${threshold} gold\nDare you challenge the champion? ⚔️`;
      await Share.share({ message, title: 'Claw & Order: Dice Unit' });
    } catch (e) {}
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onBackToMenu}>
      <View style={s.overlay}>
        <View style={s.modal}>
          <View style={s.crownRing}>
            <Ionicons name="ribbon" size={50} color="#D4AF37" />
          </View>
          <Text style={s.winTitle}>VICTORY!</Text>
          <Text style={s.winnerName}>{name}</Text>

          <View style={s.scoreBox}>
            {sorted.map((player, i) => (
              <View key={`${player.name}-${i}`} style={s.scoreRow}>
                <View style={s.scoreLeft}>
                  <Ionicons name="shield" size={14} color={PLAYER_COLORS[i % PLAYER_COLORS.length]} />
                  <Text style={s.scoreLabel}>{player.name || 'Player'}</Text>
                </View>
                <Text style={[s.scoreValue, player.name === name && s.winnerScore]}>
                  {player.totalScore || 0}
                </Text>
              </View>
            ))}
          </View>

          <Text style={s.modeTag}>{modeName} — {threshold} gold</Text>

          <Pressable testID="share-btn" style={s.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color="#1A110A" />
            <Text style={s.shareBtnText}>Challenge a Rival</Text>
          </Pressable>

          <View style={s.actions}>
            <Pressable testID="play-again-btn" style={[s.actionBtn, { backgroundColor: '#2E7D32' }]} onPress={onPlayAgain}>
              <Ionicons name="refresh" size={18} color="#F4E3C5" />
              <Text style={s.actionText}>Play Again</Text>
            </Pressable>
            <Pressable testID="leaderboard-btn-modal" style={[s.actionBtn, { backgroundColor: '#8B0000' }]} onPress={onViewLeaderboard}>
              <Ionicons name="trophy" size={18} color="#F4E3C5" />
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
  modal: { backgroundColor: '#2C1E16', borderRadius: 20, padding: 24, alignItems: 'center', width: '88%', maxWidth: 400, borderWidth: 2, borderColor: '#D4AF37' },
  crownRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212,175,55,0.1)', borderWidth: 3, borderColor: '#D4AF37', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  winTitle: { fontSize: 28, fontWeight: '900', color: '#D4AF37', letterSpacing: 4 },
  winnerName: { fontSize: 22, fontWeight: '700', color: '#F4E3C5', marginTop: 4, marginBottom: 14 },
  scoreBox: { width: '100%', backgroundColor: '#1A110A', borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#5C3D2E' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  scoreLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreLabel: { fontSize: 14, color: '#AA7C11', fontWeight: '600' },
  scoreValue: { fontSize: 18, fontWeight: '800', color: '#5C3D2E' },
  winnerScore: { color: '#D4AF37' },
  modeTag: { fontSize: 12, color: '#FF9E3D', fontWeight: '700', marginBottom: 16 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D4AF37', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, gap: 8, width: '100%', marginBottom: 10 },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: '#1A110A' },
  actions: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 12, gap: 6 },
  actionText: { fontSize: 13, fontWeight: '700', color: '#F4E3C5' },
  menuLink: { paddingVertical: 8 },
  menuLinkText: { fontSize: 13, color: '#AA7C11', fontWeight: '600' },
});
