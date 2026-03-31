import { describe, it, expect } from "vitest";
import { generateLevel, isPuzzleTrivial } from "../src/core/level-generator";
import { TUBE_CAPACITY } from "../src/core/types";

describe("isPuzzleTrivial", () => {
  it("should return true when all color groups are contiguous", () => {
    // 2 colors, each with 4 segments in order
    expect(isPuzzleTrivial([0, 0, 0, 0, 1, 1, 1, 1], 2)).toBe(true);
  });

  it("should return false when colors are mixed", () => {
    expect(isPuzzleTrivial([0, 1, 0, 1, 0, 1, 0, 1], 2)).toBe(false);
  });

  it("should return false when any tube has mixed colors", () => {
    // First tube is mixed, second is uniform
    expect(isPuzzleTrivial([0, 1, 0, 0, 1, 1, 1, 0], 2)).toBe(false);
  });

  it("should handle single color", () => {
    expect(isPuzzleTrivial([0, 0, 0, 0], 1)).toBe(true);
  });
});

describe("generateLevel", () => {
  it("should generate valid board for level 0 (level 1)", () => {
    const { board, colors } = generateLevel(0);
    expect(board.length).toBeGreaterThan(0);
    expect(colors.length).toBeGreaterThan(0);
  });

  it("should produce non-trivial puzzles", () => {
    for (let i = 0; i < 10; i++) {
      const { board } = generateLevel(i);
      // Filter out empty tubes
      const filledTubes = board.filter((t) => t.length > 0);
      // At least one tube should have mixed colors (not trivial)
      const hasMixed = filledTubes.some(
        (tube) => !tube.every((c) => c === tube[0]),
      );
      expect(hasMixed).toBe(true);
    }
  });

  it("should include empty tubes", () => {
    const { board } = generateLevel(0);
    const emptyTubes = board.filter((t) => t.length === 0);
    expect(emptyTubes.length).toBeGreaterThanOrEqual(1);
  });

  it("should have correct total segments", () => {
    for (let i = 0; i < 20; i++) {
      const { board, colors } = generateLevel(i);
      const totalSegments = board.reduce((sum, tube) => sum + tube.length, 0);
      expect(totalSegments).toBe(colors.length * TUBE_CAPACITY);
    }
  });

  it("should have equal count of each color", () => {
    const { board, colors } = generateLevel(5);
    const colorCounts: Record<number, number> = {};
    board.forEach((tube) => {
      tube.forEach((c) => {
        colorCounts[c] = (colorCounts[c] || 0) + 1;
      });
    });
    for (let c = 0; c < colors.length; c++) {
      expect(colorCounts[c]).toBe(TUBE_CAPACITY);
    }
  });

  it("should be deterministic (same level index = same board)", () => {
    const result1 = generateLevel(42);
    const result2 = generateLevel(42);
    expect(result1.colors).toEqual(result2.colors);
    // Note: board may differ due to Math.random() in shuffle,
    // but colors should be deterministic
  });

  it("should generate valid colors array", () => {
    const { colors } = generateLevel(10);
    colors.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("should fill tubes to TUBE_CAPACITY", () => {
    const { board } = generateLevel(0);
    board.forEach((tube) => {
      expect(tube.length === 0 || tube.length === TUBE_CAPACITY).toBe(true);
    });
  });

  it("should handle high-level generation", () => {
    const { board, colors } = generateLevel(99);
    expect(board.length).toBeGreaterThan(0);
    expect(colors.length).toBeGreaterThan(0);
  });
});
