/**
 * Property-based regression tests.
 *
 * Tests invariants that should hold across many different scenarios.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  cloneTubes,
  canPour,
  pour,
  isTubeSolved,
  topColor,
  topRunLength,
  shuffle,
} from "../src/core/engine";
import { generateLevel } from "../src/core/level-generator";
import {
  getDifficulty,
  getDifficultyStars,
  getDifficultyLabel,
  getLevelConfig,
} from "../src/core/difficulty";
import { hslToHex, mulberry32, generateColors } from "../src/core/color";
import {
  markLevelComplete,
  loadProgress,
  saveProgress,
  getCompletedCount,
} from "../src/core/storage";
import { TUBE_CAPACITY, TOTAL_LEVELS } from "../src/core/types";

describe("Property: Board consistency after pour operations", () => {
  it("should preserve all color counts after any sequence of pours", () => {
    for (let levelIdx = 0; levelIdx < 30; levelIdx++) {
      const { board } = generateLevel(levelIdx);

      // Count colors before
      const countBefore = new Map<number, number>();
      board.forEach((tube) =>
        tube.forEach((c) => countBefore.set(c, (countBefore.get(c) || 0) + 1)),
      );

      // Execute random valid pours
      let pours = 0;
      for (let attempt = 0; attempt < 20 && pours < 10; attempt++) {
        for (let src = 0; src < board.length; src++) {
          for (let dst = 0; dst < board.length; dst++) {
            if (src !== dst && canPour(board, src, dst)) {
              pour(board, src, dst);
              pours++;

              // Verify after each pour
              const countAfter = new Map<number, number>();
              board.forEach((tube) =>
                tube.forEach((c) => countAfter.set(c, (countAfter.get(c) || 0) + 1)),
              );

              for (const [color, count] of countBefore) {
                expect(countAfter.get(color)).toBe(count);
              }

              // Verify no tube exceeds capacity
              board.forEach((tube) => {
                expect(tube.length).toBeLessThanOrEqual(TUBE_CAPACITY);
              });

              break;
            }
          }
          if (pours >= 10) break;
        }
      }
    }
  });
});

describe("Property: Solved tubes are stable", () => {
  it("a solved tube cannot accept pours of different colors", () => {
    const tubes = [
      [0, 0, 0, 0], // solved tube 0
      [1, 1, 1],     // source tube 1
    ];

    // Cannot pour color 1 onto solved tube of color 0
    expect(canPour(tubes, 1, 0)).toBe(false);
  });

  it("a solved tube cannot be poured from (it's full)", () => {
    const tubes = [
      [0, 0, 0, 0], // solved tube 0
      [],            // empty tube
    ];

    // Can pour from solved tube to empty
    expect(canPour(tubes, 0, 1)).toBe(true);
    // But after pouring, tube 0 is no longer solved
    pour(tubes, 0, 1);
    expect(isTubeSolved(tubes[0])).toBe(false);
  });
});

describe("Property: topColor and topRunLength consistency", () => {
  it("topRunLength should always be >= 1 for non-empty tubes", () => {
    const testTubes = [
      [0],
      [0, 1],
      [0, 1, 1],
      [0, 0, 0, 0],
      [0, 1, 2, 3],
    ];

    testTubes.forEach((tube) => {
      expect(topRunLength(tube)).toBeGreaterThanOrEqual(1);
      expect(topColor(tube)).not.toBeNull();
    });
  });

  it("topRunLength should equal tube length for uniform tubes", () => {
    for (let len = 1; len <= TUBE_CAPACITY; len++) {
      const tube = Array(len).fill(5);
      expect(topRunLength(tube)).toBe(len);
    }
  });

  it("topColor of poured segments should match destination top", () => {
    const tubes = [[0, 1, 1], [2, 2, 1]];
    const srcTop = topColor(tubes[0]);
    const dstTop = topColor(tubes[1]);

    // They match (both 1), so pour should work
    expect(srcTop).toBe(dstTop);
    expect(canPour(tubes, 0, 1)).toBe(true);

    pour(tubes, 0, 1);
    // Destination top should still be 1
    expect(topColor(tubes[1])).toBe(1);
  });
});

describe("Property: cloneTubes deep independence", () => {
  it("modifying any element of clone should not affect original", () => {
    const original = [[0, 1, 2, 3], [4, 5, 6, 7], []];
    const cloned = cloneTubes(original);

    // Modify every element in clone
    cloned[0][0] = 99;
    cloned[0].push(99);
    cloned[1].pop();
    cloned[2].push(99);

    // Original should be unchanged
    expect(original[0]).toEqual([0, 1, 2, 3]);
    expect(original[1]).toEqual([4, 5, 6, 7]);
    expect(original[2]).toEqual([]);
  });
});

describe("Property: Difficulty system consistency", () => {
  it("getDifficulty should be strictly positive for valid levels", () => {
    for (let level = 1; level <= TOTAL_LEVELS; level++) {
      expect(getDifficulty(level)).toBeGreaterThan(0);
    }
  });

  it("getDifficultyStars should return values in [1, 5]", () => {
    for (let level = 1; level <= TOTAL_LEVELS; level++) {
      const stars = getDifficultyStars(level);
      expect(stars).toBeGreaterThanOrEqual(1);
      expect(stars).toBeLessThanOrEqual(5);
    }
  });

  it("getDifficultyLabel should always return a valid label", () => {
    const validLabels = ["Easy", "Normal", "Hard", "Expert", "Master"];
    for (let stars = 0; stars <= 6; stars++) {
      const label = getDifficultyLabel(stars);
      expect(validLabels).toContain(label);
    }
  });

  it("getLevelConfig emptyTubes should match difficulty threshold", () => {
    for (let level = 1; level <= TOTAL_LEVELS; level++) {
      const diff = getDifficulty(level);
      const config = getLevelConfig(level);
      if (diff > 60) {
        expect(config.emptyTubes).toBe(1);
      } else {
        expect(config.emptyTubes).toBe(2);
      }
    }
  });
});

describe("Property: Color generation determinism", () => {
  it("generateColors should always produce same result for same inputs", () => {
    for (let count = 1; count <= 20; count++) {
      for (let level = 0; level < 5; level++) {
        const c1 = generateColors(count, level);
        const c2 = generateColors(count, level);
        expect(c1).toEqual(c2);
      }
    }
  });

  it("all generated colors should be unique within a level", () => {
    for (let level = 0; level < 50; level++) {
      const config = getLevelConfig(level + 1);
      const colors = generateColors(config.colors, level);
      const unique = new Set(colors);
      expect(unique.size).toBe(colors.length);
    }
  });
});

describe("Property: hslToHex boundary values", () => {
  it("should handle all hue sector boundaries correctly", () => {
    const boundaries = [0, 59, 60, 119, 120, 179, 180, 239, 240, 299, 300, 359];
    boundaries.forEach((h) => {
      const result = hslToHex(h, 100, 50);
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("should handle extreme lightness values", () => {
    // Very dark
    const dark = hslToHex(0, 100, 1);
    expect(dark).toMatch(/^#[0-9a-f]{6}$/);
    const dR = parseInt(dark.slice(1, 3), 16);
    expect(dR).toBeLessThan(20);

    // Very light
    const light = hslToHex(0, 100, 99);
    expect(light).toMatch(/^#[0-9a-f]{6}$/);
    const lR = parseInt(light.slice(1, 3), 16);
    expect(lR).toBeGreaterThan(235);
  });

  it("should handle extreme saturation values", () => {
    // Zero saturation = grey
    const grey = hslToHex(180, 0, 50);
    const r = parseInt(grey.slice(1, 3), 16);
    const g = parseInt(grey.slice(3, 5), 16);
    const b = parseInt(grey.slice(5, 7), 16);
    expect(r).toBe(g);
    expect(g).toBe(b);

    // Full saturation
    const vivid = hslToHex(180, 100, 50);
    expect(vivid).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("Property: mulberry32 statistical quality", () => {
  it("should produce roughly uniform distribution", () => {
    const rng = mulberry32(42);
    const buckets = new Array(10).fill(0);
    const N = 10000;

    for (let i = 0; i < N; i++) {
      const val = rng();
      buckets[Math.floor(val * 10)]++;
    }

    // Each bucket should have roughly N/10 = 1000 values
    // Allow 30% deviation
    buckets.forEach((count) => {
      expect(count).toBeGreaterThan(700);
      expect(count).toBeLessThan(1300);
    });
  });

  it("should not repeat values in short sequences", () => {
    const rng = mulberry32(123);
    const values = new Set<number>();

    for (let i = 0; i < 1000; i++) {
      values.add(rng());
    }

    // All 1000 values should be unique (probability of collision is negligible)
    expect(values.size).toBe(1000);
  });
});

describe("Property: Storage consistency", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should handle completing all levels", () => {
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      markLevelComplete(i);
    }
    expect(getCompletedCount()).toBe(TOTAL_LEVELS);
  });

  it("saveProgress and loadProgress should be inverse operations", () => {
    const data = { completed: { 1: true, 50: true, 99: true } };
    saveProgress(data);
    const loaded = loadProgress();
    expect(loaded).toEqual(data);
  });

  it("should handle empty completed object", () => {
    saveProgress({ completed: {} });
    expect(getCompletedCount()).toBe(0);
  });
});

describe("Property: Level generation invariants for boundary levels", () => {
  const boundaryLevels = [0, 1, 4, 5, 9, 10, 49, 50, 98, 99];

  boundaryLevels.forEach((levelIdx) => {
    it(`level ${levelIdx} should have valid board structure`, () => {
      const { board, colors } = generateLevel(levelIdx);
      const config = getLevelConfig(levelIdx + 1);

      // Correct number of tubes
      expect(board.length).toBe(config.colors + config.emptyTubes);

      // Correct number of colors
      expect(colors.length).toBe(config.colors);

      // All filled tubes have TUBE_CAPACITY segments
      board.forEach((tube) => {
        if (tube.length > 0) {
          expect(tube.length).toBe(TUBE_CAPACITY);
        }
      });

      // Board is not trivially solved
      const filledTubes = board.filter((t) => t.length > 0);
      const allSolved = filledTubes.every((tube) => tube.every((c) => c === tube[0]));
      expect(allSolved).toBe(false);

      // Each color appears exactly TUBE_CAPACITY times
      const counts = new Map<number, number>();
      board.forEach((tube) =>
        tube.forEach((c) => counts.set(c, (counts.get(c) || 0) + 1)),
      );
      for (let c = 0; c < config.colors; c++) {
        expect(counts.get(c)).toBe(TUBE_CAPACITY);
      }
    });
  });
});

describe("Property: shuffle preserves array contents", () => {
  it("should preserve all elements across many shuffles", () => {
    for (let trial = 0; trial < 50; trial++) {
      const original = Array.from({ length: 20 }, (_, i) => i);
      const copy = [...original];
      shuffle(copy);

      // Same length
      expect(copy.length).toBe(original.length);

      // Same elements (sorted)
      expect([...copy].sort((a, b) => a - b)).toEqual(original);
    }
  });

  it("should not produce same order every time with different starting arrays", () => {
    const results = new Set<string>();
    for (let trial = 0; trial < 20; trial++) {
      const arr = Array.from({ length: 10 }, (_, i) => i);
      shuffle(arr);
      results.add(arr.join(","));
    }
    // Should produce multiple different orderings
    expect(results.size).toBeGreaterThan(1);
  });
});
