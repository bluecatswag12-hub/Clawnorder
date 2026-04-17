import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WinMode, WIN_THRESHOLDS, WIN_MODE_LABELS } from '../store/gameStore';

interface WinnerModalProps {
  visible: boolean;
  winnerName: string;
  winMode: WinMode;
  winnerScore: number;
  loserName: string;
  loserScore: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onViewLeaderboard: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  visible,
  winnerName,
  winMode,
  winnerScore,
  loserName,
  loserScore,
  onPlayAgain,
  onBackToMenu,
  onViewLeaderboard,
}) => {
  const threshold = WIN_THRESHOLDS[winMode];
  const modeName = WIN_MODE_LABELS[winMode];

  const handleShare = async () => {
    const message = `🎲 CLAW & ORDER: DICE UNIT 🎲\n\n🏆 ${winnerName} wins in ${modeName} mode!\n\nFinal Score:\n✅ ${winnerName}: ${winnerScore} pts\n❌ ${loserName}: ${loserScore} pts\n\nTarget: ${threshold} pts\n\nThink you can beat them? Download Claw & Order: Dice Unit and challenge your friends! 🔥`;

    try {
      await Share.share({
        message,
        title: 'Claw & Order: Dice Unit - Challenge Your Friends!',
      });
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onBackToMenu}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Trophy */}
          <View style={styles.trophyRing}>
            <Ionicons name="trophy" size={56} color="#FFD700" />
          </View>

          <Text style={styles.winTitle}>WINNER!</Text>
          <Text style={styles.winnerName}>{winnerName}</Text>

          {/* Score Summary */}
          <View style={styles.scoreBox}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{winnerName}</Text>
              <Text style={styles.scoreValueWin}>{winnerScore}</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>{loserName}</Text>
              <Text style={styles.scoreValueLose}>{loserScore}</Text>
            </View>
          </View>

          <Text style={styles.modeTag}>{modeName} Mode — {threshold} pts</Text>

          {/* Share CTA */}
          <Pressable testID="share-btn" style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={22} color="#fff" />
            <Text style={styles.shareBtnText}>Challenge a Friend</Text>
          </Pressable>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable testID="play-again-btn" style={[styles.actionBtn, styles.playAgainBtn]} onPress={onPlayAgain}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.actionText}>Play Again</Text>
            </Pressable>

            <Pressable testID="leaderboard-btn-modal" style={[styles.actionBtn, styles.leaderBtn]} onPress={onViewLeaderboard}>
              <Ionicons name="stats-chart" size={20} color="#fff" />
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#161625',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '88%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#FFD70044',
  },
  trophyRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFD70015',
    borderWidth: 3,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  winTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 4,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
    marginBottom: 16,
  },
  scoreBox: {
    width: '100%',
    backgroundColor: '#0d0d1a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  scoreLabel: {
    fontSize: 15,
    color: '#aaa',
    fontWeight: '600',
  },
  scoreValueWin: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4CAF50',
  },
  scoreValueLose: {
    fontSize: 22,
    fontWeight: '800',
    color: '#666',
  },
  scoreDivider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 4,
  },
  modeTag: {
    fontSize: 12,
    color: '#e91e63',
    fontWeight: '700',
    marginBottom: 20,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e91e63',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  playAgainBtn: {
    backgroundColor: '#4CAF50',
  },
  leaderBtn: {
    backgroundColor: '#2196F3',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  menuLink: {
    paddingVertical: 8,
  },
  menuLinkText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
});
