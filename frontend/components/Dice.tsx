import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface DiceProps {
  value: number;
  isRolling: boolean;
  isSelected: boolean;
  isScoring: boolean;
  onPress: () => void;
  disabled: boolean;
  index: number;
}

const DOT_POSITIONS: Record<number, Array<{ top?: string | number; bottom?: string | number; left?: string | number; right?: string | number; alignSelf?: string }>> = {
  1: [{ top: '50%', left: '50%' }],
  2: [{ top: '20%', right: '20%' }, { bottom: '20%', left: '20%' }],
  3: [{ top: '20%', right: '20%' }, { top: '50%', left: '50%' }, { bottom: '20%', left: '20%' }],
  4: [{ top: '20%', left: '20%' }, { top: '20%', right: '20%' }, { bottom: '20%', left: '20%' }, { bottom: '20%', right: '20%' }],
  5: [{ top: '20%', left: '20%' }, { top: '20%', right: '20%' }, { top: '50%', left: '50%' }, { bottom: '20%', left: '20%' }, { bottom: '20%', right: '20%' }],
  6: [{ top: '20%', left: '20%' }, { top: '50%', left: '20%' }, { bottom: '20%', left: '20%' }, { top: '20%', right: '20%' }, { top: '50%', right: '20%' }, { bottom: '20%', right: '20%' }],
};

export const Dice: React.FC<DiceProps> = ({ value, isRolling, isSelected, isScoring, onPress, disabled, index }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const bounceY = useSharedValue(0);

  useEffect(() => {
    if (isRolling) {
      const delay = index * 80;
      setTimeout(() => {
        bounceY.value = withSequence(
          withTiming(-20, { duration: 150 }),
          withSpring(0, { damping: 8, stiffness: 200 })
        );
        scale.value = withSequence(
          withTiming(0.7, { duration: 100 }),
          withSpring(1.1, { damping: 6, stiffness: 300 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        );
        rotation.value = withSequence(
          withTiming(360 + Math.random() * 180, { duration: 500 }),
          withTiming(0, { duration: 0 })
        );
      }, delay);
    }
  }, [isRolling]);

  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.1, { damping: 10, stiffness: 300 });
    } else {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    }
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounceY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const dotSize = 8;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      testID={`dice-${index}`}
    >
      <Animated.View
        style={[
          styles.diceContainer,
          animatedStyle,
          isSelected && styles.selectedDice,
          isScoring && !isSelected && styles.scoringDice,
          !isScoring && !isSelected && styles.nonScoringDice,
        ]}
      >
        <View style={styles.diceFace}>
          {(DOT_POSITIONS[value] || []).map((pos, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  position: 'absolute',
                  ...(pos.top !== undefined ? { top: pos.top } : {}),
                  ...(pos.bottom !== undefined ? { bottom: pos.bottom } : {}),
                  ...(pos.left !== undefined ? { left: pos.left } : {}),
                  ...(pos.right !== undefined ? { right: pos.right } : {}),
                  marginTop: pos.top === '50%' ? -dotSize / 2 : 0,
                  marginLeft: pos.left === '50%' ? -dotSize / 2 : 0,
                },
                isSelected && styles.selectedDot,
              ]}
            />
          ))}
        </View>
        {isSelected && (
          <View style={styles.checkMark}>
            <Text style={styles.checkMarkText}>✓</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  diceContainer: {
    margin: 6,
    borderRadius: 12,
    padding: 2,
  },
  diceFace: {
    width: 52,
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#444',
    position: 'relative',
  },
  selectedDice: {
    borderColor: '#4CAF50',
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  scoringDice: {
    opacity: 1,
  },
  nonScoringDice: {
    opacity: 0.5,
  },
  dot: {
    backgroundColor: '#222',
  },
  selectedDot: {
    backgroundColor: '#1B5E20',
  },
  checkMark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  checkMarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});
