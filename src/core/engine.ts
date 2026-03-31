/**
 * Game engine module.
 *
 * Core game logic: pour validation, pouring, win detection, utilities.
 */

import { type Tube, type GameBoard, type ColorIndex, TUBE_CAPACITY } from "./types";

/**
 * Deep-clone a game board.
 *
 * @param src - Source game board
 * @returns A deep copy of the board
 */
export function cloneTubes(src: GameBoard): GameBoard {
  return src.map((t) => t.slice());
}

/**
 * Fisher–Yates shuffle (in-place).
 *
 * @param arr - Array to shuffle
 * @returns The same array, shuffled
 */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/**
 * Check if a tube is fully solved (4 segments of one color).
 *
 * @param tube - Tube to check
 * @returns true if the tube contains exactly TUBE_CAPACITY segments of one color
 */
export function isTubeSolved(tube: Tube): boolean {
  return tube.length === TUBE_CAPACITY && tube.every((c) => c === tube[0]);
}

/**
 * Get the top color of a tube.
 *
 * @param tube - Tube to inspect
 * @returns The color index at the top, or null if empty
 */
export function topColor(tube: Tube): ColorIndex | null {
  return tube.length > 0 ? tube[tube.length - 1] : null;
}

/**
 * Count how many consecutive same-color segments are at the top of a tube.
 *
 * @param tube - Tube to inspect
 * @returns Length of the top run
 */
export function topRunLength(tube: Tube): number {
  if (tube.length === 0) return 0;
  const color = topColor(tube)!;
  let count = 0;
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] === color) count++;
    else break;
  }
  return count;
}

/**
 * Check if pouring from source to destination is valid.
 *
 * @param tubes - Current game board
 * @param srcIdx - Source tube index
 * @param dstIdx - Destination tube index
 * @returns true if the pour is valid
 */
export function canPour(tubes: GameBoard, srcIdx: number, dstIdx: number): boolean {
  const src = tubes[srcIdx];
  const dst = tubes[dstIdx];
  if (src.length === 0) return false;
  if (dst.length >= TUBE_CAPACITY) return false;
  if (dst.length === 0) return true;
  return topColor(src) === topColor(dst);
}

/**
 * Execute a pour from source to destination.
 * Modifies the tubes in place.
 *
 * @param tubes - Current game board (mutated)
 * @param srcIdx - Source tube index
 * @param dstIdx - Destination tube index
 * @returns Number of segments poured
 */
export function pour(tubes: GameBoard, srcIdx: number, dstIdx: number): number {
  const src = tubes[srcIdx];
  const dst = tubes[dstIdx];
  const color = topColor(src)!;
  const space = TUBE_CAPACITY - dst.length;
  const run = topRunLength(src);
  const amount = Math.min(run, space);
  for (let i = 0; i < amount; i++) {
    src.pop();
    dst.push(color);
  }
  return amount;
}

/**
 * Check if all tubes are solved (win condition).
 *
 * @param tubes - Current game board
 * @returns true if every tube is either empty or fully solved
 */
export function checkWin(tubes: GameBoard): boolean {
  return tubes.every((tube) => tube.length === 0 || isTubeSolved(tube));
}
