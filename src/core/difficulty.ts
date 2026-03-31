/**
 * Difficulty system module.
 *
 * Manages level difficulty scaling including star ratings,
 * difficulty labels, and level configuration.
 */

import {
  type LevelConfig,
  type DifficultyLabel,
  DIFFICULTY_COLOR_DIVISOR,
  MAX_COLORS,
  HIGH_DIFFICULTY_THRESHOLD,
} from "./types";

/**
 * Calculate raw difficulty score for a level.
 *
 * Every 5 levels:  difficulty += levelNum / 5
 * Every 10 levels: difficulty += levelNum / 10
 *
 * @param levelNum - 1-based level number
 * @returns Difficulty score
 */
export function getDifficulty(levelNum: number): number {
  const base = levelNum;
  const bonus5 = levelNum % 5 === 0 ? Math.floor(levelNum / 5) : 0;
  const bonus10 = levelNum % 10 === 0 ? Math.floor(levelNum / 10) : 0;
  return base + bonus5 + bonus10;
}

/**
 * Map level number to a 1–5 star difficulty rating.
 *
 * @param levelNum - 1-based level number
 * @returns Star count (1–5)
 */
export function getDifficultyStars(levelNum: number): number {
  const d = getDifficulty(levelNum);
  if (d <= 10) return 1;
  if (d <= 25) return 2;
  if (d <= 50) return 3;
  if (d <= 80) return 4;
  return 5;
}

/**
 * Get the human-readable label for a star rating.
 *
 * @param stars - Star count (1–5)
 * @returns Difficulty label string
 */
export function getDifficultyLabel(stars: number): DifficultyLabel {
  const labels: Record<number, DifficultyLabel> = {
    1: "Easy",
    2: "Normal",
    3: "Hard",
    4: "Expert",
    5: "Master",
  };
  return labels[stars] || "Master";
}

/**
 * Generate level configuration based on level number.
 *
 * @param levelNum - 1-based level number
 * @returns Level configuration with color count and empty tube count
 */
export function getLevelConfig(levelNum: number): LevelConfig {
  const diff = getDifficulty(levelNum);
  let numColors = Math.min(2 + Math.floor(diff / DIFFICULTY_COLOR_DIVISOR), MAX_COLORS);
  if (numColors < 2) numColors = 2;
  const emptyTubes = diff > HIGH_DIFFICULTY_THRESHOLD ? 1 : 2;
  return { colors: numColors, emptyTubes };
}
