/**
 * Level generation module.
 *
 * Procedurally generates solvable puzzle levels using seeded randomness.
 */

import { type GameBoard, type ColorIndex, TUBE_CAPACITY, MAX_SHUFFLE_ATTEMPTS } from "./types";
import { generateColors } from "./color";
import { getLevelConfig } from "./difficulty";
import { shuffle } from "./engine";

/**
 * Check if a shuffled segment array produces a trivial (already solved) puzzle.
 *
 * @param segments - Flat array of color indices
 * @param numColors - Number of distinct colors
 * @returns true if every tube would already be solved
 */
export function isPuzzleTrivial(segments: ColorIndex[], numColors: number): boolean {
  for (let t = 0; t < numColors; t++) {
    const slice = segments.slice(t * TUBE_CAPACITY, (t + 1) * TUBE_CAPACITY);
    const allSame = slice.every((c) => c === slice[0]);
    if (!allSame) return false;
  }
  return true;
}

/**
 * Generate a level's game board.
 *
 * @param levelIndex - 0-based level index
 * @returns Object containing the game board and the level's color palette
 */
export function generateLevel(levelIndex: number): {
  board: GameBoard;
  colors: string[];
} {
  const levelNum = levelIndex + 1;
  const config = getLevelConfig(levelNum);
  const numColors = config.colors;
  const emptyTubes = config.emptyTubes;

  const colors = generateColors(numColors, levelIndex);

  // Build flat array with TUBE_CAPACITY copies of each color index
  const segments: ColorIndex[] = [];
  for (let c = 0; c < numColors; c++) {
    for (let s = 0; s < TUBE_CAPACITY; s++) {
      segments.push(c);
    }
  }

  // Shuffle until the puzzle is not trivially solved
  let attempts = 0;
  do {
    shuffle(segments);
    attempts++;
  } while (isPuzzleTrivial(segments, numColors) && attempts < MAX_SHUFFLE_ATTEMPTS);

  // Final fallback: swap first and last elements
  if (isPuzzleTrivial(segments, numColors) && segments.length >= 2) {
    const tmp = segments[0];
    segments[0] = segments[segments.length - 1];
    segments[segments.length - 1] = tmp;
  }

  // Distribute into tubes
  const board: GameBoard = [];
  for (let t = 0; t < numColors; t++) {
    board.push(segments.slice(t * TUBE_CAPACITY, (t + 1) * TUBE_CAPACITY));
  }
  for (let e = 0; e < emptyTubes; e++) {
    board.push([]);
  }

  return { board, colors };
}
