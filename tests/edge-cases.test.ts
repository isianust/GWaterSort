/**
 * Additional edge case and coverage gap tests.
 *
 * Targets specific uncovered lines and boundary conditions.
 */
import { describe, it, expect } from "vitest";
import { getLevelConfig, getDifficulty } from "../src/core/difficulty";
import { isPuzzleTrivial, generateLevel } from "../src/core/level-generator";
import {
  canPour,
  pour,
  checkWin,
  topRunLength,
  cloneTubes,
  isTubeSolved,
  shuffle,
} from "../src/core/engine";
import { hslToHex, mulberry32, generateColors } from "../src/core/color";
import { MAX_COLORS } from "../src/core/types";

describe("Coverage gaps: getLevelConfig edge cases", () => {
  it("should enforce minimum of 2 colors even with very low difficulty", () => {
    // Level 1: difficulty = 1, floor(1/8) = 0, so numColors = 2 + 0 = 2
    const config = getLevelConfig(1);
    expect(config.colors).toBeGreaterThanOrEqual(2);
  });

  it("should handle the numColors < 2 guard (difficulty.ts:73)", () => {
    // This tests the guard: if (numColors < 2) numColors = 2
    // With DIFFICULTY_COLOR_DIVISOR = 8, the minimum is 2 + floor(1/8) = 2
    // The guard is a safety net for edge cases
    // We verify it works by checking all low levels
    for (let i = 1; i <= 10; i++) {
      const config = getLevelConfig(i);
      expect(config.colors).toBeGreaterThanOrEqual(2);
    }
  });

  it("should handle boundary between 1 and 2 empty tubes", () => {
    // HIGH_DIFFICULTY_THRESHOLD = 60
    // Need to find levels around this boundary
    for (let levelNum = 1; levelNum <= 100; levelNum++) {
      const diff = getDifficulty(levelNum);
      const config = getLevelConfig(levelNum);
      if (diff > 60) {
        expect(config.emptyTubes).toBe(1);
      } else {
        expect(config.emptyTubes).toBe(2);
      }
    }
  });

  it("should cap at MAX_COLORS for very high levels", () => {
    // Level 100: difficulty=130, floor(130/8)=16, 2+16=18 < 20
    const config = getLevelConfig(100);
    expect(config.colors).toBeLessThanOrEqual(MAX_COLORS);
  });
});

describe("Coverage gaps: isPuzzleTrivial fallback swap", () => {
  it("should handle the trivial puzzle fallback correctly", () => {
    // Test the fallback swap logic in generateLevel
    // We can test isPuzzleTrivial directly with edge cases
    // A sorted array of [0,0,0,0,1,1,1,1] is trivial
    expect(isPuzzleTrivial([0, 0, 0, 0, 1, 1, 1, 1], 2)).toBe(true);
    // After swapping first and last: [1,0,0,0,1,1,1,0] is NOT trivial
    const swapped = [0, 0, 0, 0, 1, 1, 1, 1];
    const tmp = swapped[0];
    swapped[0] = swapped[swapped.length - 1];
    swapped[swapped.length - 1] = tmp;
    expect(isPuzzleTrivial(swapped, 2)).toBe(false);
  });

  it("should handle 3-color trivial check", () => {
    expect(isPuzzleTrivial([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2], 3)).toBe(true);
    expect(isPuzzleTrivial([0, 0, 0, 1, 1, 1, 1, 0, 2, 2, 2, 2], 3)).toBe(false);
  });

  it("should handle single-element segments", () => {
    // 2 colors, 1 capacity each (if TUBE_CAPACITY were 1)
    // With real TUBE_CAPACITY=4, this is just [0,0,0,0] for 1 color
    expect(isPuzzleTrivial([0, 0, 0, 0], 1)).toBe(true);
  });
});

describe("Edge cases: engine functions", () => {
  it("canPour should handle same-index source and destination", () => {
    const tubes = [[0, 1, 2, 3]];
    // Pouring to itself - capacity check prevents it (tube is full)
    expect(canPour(tubes, 0, 0)).toBe(false);
  });

  it("canPour should work with tubes having different fill levels", () => {
    // Source has 1 segment, dest has 3 matching segments
    const tubes = [[1], [1, 1, 1]];
    expect(canPour(tubes, 0, 1)).toBe(true);
    const amount = pour(tubes, 0, 1);
    expect(amount).toBe(1);
    expect(tubes[0]).toEqual([]);
    expect(tubes[1]).toEqual([1, 1, 1, 1]);
    expect(isTubeSolved(tubes[1])).toBe(true);
  });

  it("pour should handle pouring a full run into exactly matching space", () => {
    // Source: [0, 1, 1, 1] (run of 3), dest: [1] (space for 3)
    const tubes = [[0, 1, 1, 1], [1]];
    const amount = pour(tubes, 0, 1);
    expect(amount).toBe(3);
    expect(tubes[0]).toEqual([0]);
    expect(tubes[1]).toEqual([1, 1, 1, 1]);
  });

  it("pour should handle pouring when run is larger than space", () => {
    // Source: [1, 1, 1, 1] (run of 4), dest: [1, 1] (space for 2)
    const tubes = [[1, 1, 1, 1], [1, 1]];
    const amount = pour(tubes, 0, 1);
    expect(amount).toBe(2);
    expect(tubes[0]).toEqual([1, 1]);
    expect(tubes[1]).toEqual([1, 1, 1, 1]);
  });

  it("topRunLength should correctly count runs in complex tubes", () => {
    expect(topRunLength([0, 1, 2, 2, 2])).toBe(3);
    expect(topRunLength([0, 0, 1, 0, 0])).toBe(2);
    expect(topRunLength([5, 5, 5, 5])).toBe(4);
  });

  it("checkWin should handle board with single solved tube", () => {
    expect(checkWin([[0, 0, 0, 0]])).toBe(true);
  });

  it("checkWin should fail with a single partially filled tube", () => {
    expect(checkWin([[0, 0]])).toBe(false);
  });

  it("checkWin should handle many tubes", () => {
    const tubes = [];
    for (let i = 0; i < 20; i++) {
      tubes.push([i, i, i, i]);
    }
    tubes.push([]); // one empty
    expect(checkWin(tubes)).toBe(true);
  });

  it("cloneTubes should handle large boards", () => {
    const board = Array.from({ length: 22 }, (_, i) =>
      i < 20 ? [i, i, i, i] : [],
    );
    const cloned = cloneTubes(board);
    expect(cloned).toEqual(board);
    cloned[5][0] = 999;
    expect(board[5][0]).toBe(5); // original unchanged
  });

  it("shuffle should produce different orderings over many runs", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    let differentCount = 0;
    for (let trial = 0; trial < 20; trial++) {
      const arr = [...original];
      shuffle(arr);
      if (arr.join(",") !== original.join(",")) {
        differentCount++;
      }
    }
    // With 8 elements, probability of shuffling to same order is ~1/40320
    expect(differentCount).toBeGreaterThan(0);
  });

  it("isTubeSolved should handle tube with 5 elements (over capacity)", () => {
    // Even though game shouldn't allow this, the function should handle it
    expect(isTubeSolved([0, 0, 0, 0, 0])).toBe(false); // length !== 4
  });
});

describe("Edge cases: color generation", () => {
  it("should handle very large color counts", () => {
    const colors = generateColors(20, 0);
    expect(colors).toHaveLength(20);
    colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
  });

  it("should handle negative hue values after modulo", () => {
    // hslToHex handles h % 360, so h=-60 should work like h=300
    const result = hslToHex(-60, 50, 50);
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("should handle zero saturation (grey tones)", () => {
    const grey50 = hslToHex(0, 0, 50);
    expect(grey50).toMatch(/^#[0-9a-f]{6}$/);
    // With 0 saturation, R=G=B
    const r = parseInt(grey50.slice(1, 3), 16);
    const g = parseInt(grey50.slice(3, 5), 16);
    const b = parseInt(grey50.slice(5, 7), 16);
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it("should produce consistent colors for boundary hues", () => {
    // Test all 60-degree boundaries
    const hues = [0, 60, 120, 180, 240, 300];
    hues.forEach((h) => {
      const color = hslToHex(h, 100, 50);
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("mulberry32 should handle seed 0", () => {
    const rng = mulberry32(0);
    const val = rng();
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThan(1);
  });

  it("mulberry32 should handle negative seeds", () => {
    const rng = mulberry32(-12345);
    for (let i = 0; i < 10; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("mulberry32 should handle very large seeds", () => {
    const rng = mulberry32(2147483647); // MAX_INT32
    for (let i = 0; i < 10; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe("Edge cases: level generation boundary", () => {
  it("should generate valid levels at both ends (0 and 99)", () => {
    const level0 = generateLevel(0);
    const level99 = generateLevel(99);

    expect(level0.board.length).toBeGreaterThan(0);
    expect(level99.board.length).toBeGreaterThan(0);

    // Level 99 should have more colors than level 0
    expect(level99.colors.length).toBeGreaterThan(level0.colors.length);
  });

  it("should not produce boards where all filled tubes are already solved", () => {
    // This would mean the puzzle is trivially solved
    for (let i = 0; i < 50; i++) {
      const { board } = generateLevel(i);
      const filledTubes = board.filter((t) => t.length > 0);
      const allSolved = filledTubes.every(
        (tube) => tube.every((c) => c === tube[0]),
      );
      expect(allSolved).toBe(false);
    }
  });
});
