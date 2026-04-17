// Game logic for dice scoring and BUST detection with dice selection

export interface DiceRoll {
  values: number[];
}

export interface ScoreResult {
  score: number;
  breakdown: string[];
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Calculate score from SELECTED dice only
 * Returns score and breakdown of scoring
 */
export function calculateSelectedScore(selectedDice: number[]): ScoreResult {
  if (selectedDice.length === 0) {
    return {
      score: 0,
      breakdown: [],
      isValid: false,
      errorMessage: 'Must select at least one scoring die'
    };
  }

  const sorted = [...selectedDice].sort((a, b) => a - b);
  const counts: { [key: number]: number } = {};
  
  // Count occurrences
  sorted.forEach(val => {
    counts[val] = (counts[val] || 0) + 1;
  });

  let score = 0;
  const breakdown: string[] = [];
  const used = new Array(selectedDice.length).fill(false);

  // Check for full straight 123456 first (exact 6 unique dice)
  const uniqueSorted = Array.from(new Set(sorted)).sort((a, b) => a - b);
  const uniqueStr = uniqueSorted.join('');

  if (uniqueStr === '123456' && selectedDice.length === 6) {
    return {
      score: 1500,
      breakdown: ['123456 = 1500 points'],
      isValid: true
    };
  }

  // Check if dice CONTAIN a straight (12345 or 23456) with possible leftover scoring dice
  let straightFound = false;

  if (uniqueStr.includes('12345') || (uniqueSorted.includes(1) && uniqueSorted.includes(2) && uniqueSorted.includes(3) && uniqueSorted.includes(4) && uniqueSorted.includes(5))) {
    // 12345 straight found — mark one of each as used
    score += 500;
    breakdown.push('12345 = 500 points');
    straightFound = true;
    for (const needed of [1, 2, 3, 4, 5]) {
      const idx = selectedDice.findIndex((v, i) => v === needed && !used[i]);
      if (idx !== -1) used[idx] = true;
    }
  } else if (uniqueStr.includes('23456') || (uniqueSorted.includes(2) && uniqueSorted.includes(3) && uniqueSorted.includes(4) && uniqueSorted.includes(5) && uniqueSorted.includes(6))) {
    // 23456 straight found
    score += 750;
    breakdown.push('23456 = 750 points');
    straightFound = true;
    for (const needed of [2, 3, 4, 5, 6]) {
      const idx = selectedDice.findIndex((v, i) => v === needed && !used[i]);
      if (idx !== -1) used[idx] = true;
    }
  }

  if (!straightFound) {
    // Check for sets of same number with exponential multipliers
    Object.keys(counts).forEach(key => {
      const num = parseInt(key);
      const count = counts[num];
      
      if (count >= 3) {
        let baseScore = 0;
        let setName = '';
        
        if (num === 1) {
          baseScore = 1000;
          setName = '111';
        } else if (num === 5) {
          baseScore = 500;
          setName = '555';
        } else {
          baseScore = num * 100;
          setName = `${num}${num}${num}`;
        }
        
        const extraDice = count - 3;
        const multiplier = Math.pow(2, extraDice);
        const finalScore = baseScore * multiplier;
        
        score += finalScore;
        
        if (multiplier > 1) {
          breakdown.push(`${num.toString().repeat(count)} = ${baseScore} × ${multiplier} = ${finalScore} points`);
        } else {
          breakdown.push(`${setName} = ${finalScore} points`);
        }
        
        for (let i = 0; i < count; i++) {
          const idx = selectedDice.findIndex((v, idx) => v === num && !used[idx]);
          if (idx !== -1) used[idx] = true;
        }
      }
    });
  }

  // Check for individual 1s and 5s (not already used by straight or set)
  selectedDice.forEach((val, idx) => {
    if (used[idx]) return;
    
    if (val === 1) {
      score += 100;
      breakdown.push('1 = 100 points');
      used[idx] = true;
    } else if (val === 5) {
      score += 50;
      breakdown.push('5 = 50 points');
      used[idx] = true;
    }
  });

  // Check if selection contains only scoring dice
  const hasNonScoringDice = used.some(u => !u);
  if (hasNonScoringDice) {
    return {
      score: 0,
      breakdown: [],
      isValid: false,
      errorMessage: 'Selection contains non-scoring dice'
    };
  }

  // Must have at least one 1 or 5 (or valid combination)
  if (score === 0) {
    return {
      score: 0,
      breakdown: [],
      isValid: false,
      errorMessage: 'Must select at least one scoring die (1, 5, or valid combination)'
    };
  }

  return {
    score,
    breakdown,
    isValid: true
  };
}

/**
 * Check if a single die value is potentially scoring
 */
export function isPotentiallyScoringDie(value: number, allDice: number[]): boolean {
  // 1s and 5s are always scoring
  if (value === 1 || value === 5) return true;
  
  // Check if this die can be part of a set (3+ of same)
  const count = allDice.filter(d => d === value).length;
  if (count >= 3) return true;
  
  // Check if can be part of a straight
  const uniqueDice = Array.from(new Set(allDice)).sort((a, b) => a - b);
  const sortedStr = uniqueDice.join('');
  if (sortedStr.includes('123456') || sortedStr.includes('12345') || sortedStr.includes('23456')) {
    return true;
  }
  
  return false;
}

/**
 * Check if the current dice have ANY scoring possibilities
 */
export function hasAnyScoringDice(dice: number[]): boolean {
  // Check for 1s or 5s
  if (dice.includes(1) || dice.includes(5)) return true;
  
  // Check for sets of 3+
  const counts: { [key: number]: number } = {};
  dice.forEach(val => {
    counts[val] = (counts[val] || 0) + 1;
  });
  
  for (const count of Object.values(counts)) {
    if (count >= 3) return true;
  }
  
  // Check for straights
  const sorted = [...dice].sort((a, b) => a - b);
  const sortedStr = sorted.join('');
  if (sortedStr === '123456' || sorted.slice(0, 5).join('') === '12345' || sorted.slice(1).join('') === '23456') {
    return true;
  }
  
  return false;
}

/**
 * Roll dice - returns array of random values between 1-6
 */
export function rollDice(count: number = 6): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

/**
 * Check if a player has won
 */
export function checkWinner(score: number): boolean {
  return score >= 3000;
}

/**
 * Get visual hint for which dice are scoring
 */
export function getScoringHints(dice: number[]): boolean[] {
  return dice.map(die => isPotentiallyScoringDie(die, dice));
}
