/**
 * Progress persistence module.
 *
 * Manages player progress using localStorage.
 */

import { type ProgressData, STORAGE_KEY } from "./types";

/**
 * Load player progress from localStorage.
 *
 * @returns Progress data with completed levels
 */
export function loadProgress(): ProgressData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data) as ProgressData;
  } catch {
    /* ignore parse errors */
  }
  return { completed: {} };
}

/**
 * Save player progress to localStorage.
 *
 * @param progress - Progress data to save
 */
export function saveProgress(progress: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Mark a level as completed and persist.
 *
 * @param levelNum - 1-based level number
 */
export function markLevelComplete(levelNum: number): void {
  const progress = loadProgress();
  progress.completed[levelNum] = true;
  saveProgress(progress);
}

/**
 * Get the count of completed levels.
 *
 * @returns Number of completed levels
 */
export function getCompletedCount(): number {
  const progress = loadProgress();
  return Object.keys(progress.completed).length;
}
