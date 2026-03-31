/**
 * Color generation module.
 *
 * Generates visually distinct colors using golden-angle spacing
 * in HSL, then converts to hex. Uses a seeded PRNG for reproducibility.
 */

import { COLOR_SAT_MIN, COLOR_SAT_RANGE, COLOR_LIT_MIN, COLOR_LIT_RANGE } from "./types";

/**
 * Convert HSL values to a hex color string.
 *
 * @param h - Hue (0–360)
 * @param s - Saturation (0–100)
 * @param l - Lightness (0–100)
 * @returns Hex color string (e.g. "#ff00aa")
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = h % 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const rInt = Math.round((r + m) * 255);
  const gInt = Math.round((g + m) * 255);
  const bInt = Math.round((b + m) * 255);

  return "#" + ((1 << 24) + (rInt << 16) + (gInt << 8) + bInt).toString(16).slice(1);
}

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Ensures the same seed always produces the same sequence.
 *
 * @param seed - Integer seed value
 * @returns A function that returns the next pseudo-random number [0, 1)
 */
export function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate `count` visually distinct random colors for a given level.
 * Uses golden-angle hue spacing with random saturation/lightness offsets.
 *
 * @param count - Number of colors to generate
 * @param levelIndex - 0-based level index (used as seed)
 * @returns Array of hex color strings
 */
export function generateColors(count: number, levelIndex: number): string[] {
  const rng = mulberry32(levelIndex * 7919 + 31);
  const colors: string[] = [];
  const goldenAngle = 137.508;
  const baseHue = rng() * 360;

  for (let i = 0; i < count; i++) {
    const hue = (baseHue + i * goldenAngle + rng() * 15) % 360;
    const sat = COLOR_SAT_MIN + rng() * COLOR_SAT_RANGE;
    const lit = COLOR_LIT_MIN + rng() * COLOR_LIT_RANGE;
    colors.push(hslToHex(hue, sat, lit));
  }
  return colors;
}
