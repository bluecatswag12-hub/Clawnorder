import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WinMode, WIN_THRESHOLDS } from '../store/gameStore';

interface WinnerModalProps {
  visible: boolean;
  winnerName: string;
  winMode: WinMode;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  visible,
  winnerName,
  winMode,
  onPlayAgain,
  onBackToMenu,
}) => {
  const threshold = WIN_THRESHOLDS[winMode];
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onBackToMenu}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={80} color="#FFD700" />
          </View>
          
          <Text style={styles.title}>WINNER!</Text>
          <Text style={styles.winnerName}>{winnerName}</Text>
          <Text style={styles.subtitle}>has reached {threshold} points!</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.playAgainButton]}
              onPress={onPlayAgain}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.buttonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.menuButton]}
              onPress={onBackToMenu}
              activeOpacity={0.8}
            >
              <Ionicons name="home" size={24} color="#fff" />
              <Text style={styles.buttonText}>Main Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  winnerName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  playAgainButton: {
    backgroundColor: '#4CAF50',
  },
  menuButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});
