/**
 * Types module tests.
 *
 * Verifies that all exported constants have expected values
 * and that types are correctly defined.
 */
import { describe, it, expect } from "vitest";
import {
  TUBE_CAPACITY,
  TOTAL_LEVELS,
  MAX_LEVELS,
  STORAGE_KEY,
  COLOR_SAT_MIN,
  COLOR_SAT_RANGE,
  COLOR_LIT_MIN,
  COLOR_LIT_RANGE,
  DIFFICULTY_COLOR_DIVISOR,
  MAX_COLORS,
  HIGH_DIFFICULTY_THRESHOLD,
  SEGMENT_HEIGHT_PX,
  RISE_OFFSET_PX,
  DROP_HOVER_OFFSET_PX,
  INITIAL_DROP_OFFSET_PX,
  DROP_HALF_WIDTH_PX,
  DROP_WIDTH_PX,
  RISE_DURATION_MS,
  MOVE_DURATION_MS,
  DROP_DURATION_MS,
  ANIMATION_EASING,
  MAX_SHUFFLE_ATTEMPTS,
} from "../src/core/types";

describe("types.ts: Game constants", () => {
  it("should have TUBE_CAPACITY of 4", () => {
    expect(TUBE_CAPACITY).toBe(4);
  });

  it("should have TOTAL_LEVELS of 100", () => {
    expect(TOTAL_LEVELS).toBe(100);
  });

  it("should have MAX_LEVELS of 65536", () => {
    expect(MAX_LEVELS).toBe(65536);
  });

  it("should have correct STORAGE_KEY", () => {
    expect(STORAGE_KEY).toBe("waterSortProgress");
  });
});

describe("types.ts: Color constants", () => {
  it("should have valid saturation range", () => {
    expect(COLOR_SAT_MIN).toBeGreaterThan(0);
    expect(COLOR_SAT_RANGE).toBeGreaterThan(0);
    expect(COLOR_SAT_MIN + COLOR_SAT_RANGE).toBeLessThanOrEqual(100);
  });

  it("should have valid lightness range", () => {
    expect(COLOR_LIT_MIN).toBeGreaterThan(0);
    expect(COLOR_LIT_RANGE).toBeGreaterThan(0);
    expect(COLOR_LIT_MIN + COLOR_LIT_RANGE).toBeLessThanOrEqual(100);
  });
});

describe("types.ts: Difficulty constants", () => {
  it("should have positive DIFFICULTY_COLOR_DIVISOR", () => {
    expect(DIFFICULTY_COLOR_DIVISOR).toBeGreaterThan(0);
  });

  it("should have MAX_COLORS > TUBE_CAPACITY", () => {
    expect(MAX_COLORS).toBeGreaterThan(TUBE_CAPACITY);
  });

  it("should have positive HIGH_DIFFICULTY_THRESHOLD", () => {
    expect(HIGH_DIFFICULTY_THRESHOLD).toBeGreaterThan(0);
  });
});

describe("types.ts: Animation constants", () => {
  it("should have positive segment height", () => {
    expect(SEGMENT_HEIGHT_PX).toBeGreaterThan(0);
  });

  it("should have positive rise offset", () => {
    expect(RISE_OFFSET_PX).toBeGreaterThan(0);
  });

  it("should have positive drop dimensions", () => {
    expect(DROP_WIDTH_PX).toBeGreaterThan(0);
    expect(DROP_HALF_WIDTH_PX).toBe(DROP_WIDTH_PX / 2);
  });

  it("should have positive animation durations", () => {
    expect(RISE_DURATION_MS).toBeGreaterThan(0);
    expect(MOVE_DURATION_MS).toBeGreaterThan(0);
    expect(DROP_DURATION_MS).toBeGreaterThan(0);
  });

  it("should have valid animation easing", () => {
    expect(ANIMATION_EASING).toContain("cubic-bezier");
  });

  it("should have positive max shuffle attempts", () => {
    expect(MAX_SHUFFLE_ATTEMPTS).toBeGreaterThan(0);
  });

  it("should have reasonable hover/drop offsets", () => {
    expect(DROP_HOVER_OFFSET_PX).toBeGreaterThan(0);
    expect(INITIAL_DROP_OFFSET_PX).toBeGreaterThan(0);
  });
});

describe("types.ts: Constant relationships", () => {
  it("TOTAL_LEVELS should be less than MAX_LEVELS", () => {
    expect(TOTAL_LEVELS).toBeLessThan(MAX_LEVELS);
  });

  it("color generation should produce valid ranges", () => {
    // Saturation: [55, 95]
    expect(COLOR_SAT_MIN).toBe(55);
    expect(COLOR_SAT_MIN + COLOR_SAT_RANGE).toBe(95);

    // Lightness: [35, 65]
    expect(COLOR_LIT_MIN).toBe(35);
    expect(COLOR_LIT_MIN + COLOR_LIT_RANGE).toBe(65);
  });

  it("animation total time should be reasonable", () => {
    const totalAnimation = RISE_DURATION_MS + MOVE_DURATION_MS + DROP_DURATION_MS;
    expect(totalAnimation).toBeLessThan(5000); // Under 5 seconds
    expect(totalAnimation).toBeGreaterThan(100); // At least 100ms
  });
});
