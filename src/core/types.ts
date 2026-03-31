/**
 * Core type definitions for GWaterSort game engine.
 */

/** A color index stored in a tube segment. */
export type ColorIndex = number;

/** A tube is an array of color indices, bottom to top. */
export type Tube = ColorIndex[];

/** The complete game board state. */
export type GameBoard = Tube[];

/** Configuration for a single level. */
export interface LevelConfig {
  /** Number of distinct colors in this level. */
  colors: number;
  /** Number of empty tubes provided. */
  emptyTubes: number;
}

/** Player progress data stored in localStorage. */
export interface ProgressData {
  completed: Record<number, boolean>;
}

/** Difficulty tier labels. */
export type DifficultyLabel = "Easy" | "Normal" | "Hard" | "Expert" | "Master";

/** Game constants. */
export const TUBE_CAPACITY = 4;
export const TOTAL_LEVELS = 100;
export const MAX_LEVELS = 65536;
export const STORAGE_KEY = "waterSortProgress";

/** Color generation tuning. */
export const COLOR_SAT_MIN = 55;
export const COLOR_SAT_RANGE = 40;
export const COLOR_LIT_MIN = 35;
export const COLOR_LIT_RANGE = 30;

/** Difficulty tuning. */
export const DIFFICULTY_COLOR_DIVISOR = 8;
export const MAX_COLORS = 20;
export const HIGH_DIFFICULTY_THRESHOLD = 60;

/** Animation constants (pixels & milliseconds). */
export const SEGMENT_HEIGHT_PX = 38;
export const RISE_OFFSET_PX = 50;
export const DROP_HOVER_OFFSET_PX = 30;
export const INITIAL_DROP_OFFSET_PX = 10;
export const DROP_HALF_WIDTH_PX = 20;
export const DROP_WIDTH_PX = 40;
export const RISE_DURATION_MS = 250;
export const MOVE_DURATION_MS = 400;
export const DROP_DURATION_MS = 300;
export const ANIMATION_EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

/** Shuffle. */
export const MAX_SHUFFLE_ATTEMPTS = 200;
