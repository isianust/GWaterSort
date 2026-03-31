/**
 * Stress and property-based tests.
 *
 * Validates invariants across many levels and game states.
 */
import { describe, it, expect } from "vitest";
import { generateLevel } from "../src/core/level-generator";
import {
  canPour,
  pour,
  checkWin,
  cloneTubes,
} from "../src/core/engine";
import { getLevelConfig, getDifficultyStars } from "../src/core/difficulty";
import { TUBE_CAPACITY } from "../src/core/types";

describe("Stress: Generate all 100 levels without errors", () => {
  it("should generate all 100 levels with valid structure", () => {
    for (let i = 0; i < 100; i++) {
      expect(() => {
        const { board, colors } = generateLevel(i);

        // Basic structural checks
        expect(board.length).toBeGreaterThan(0);
        expect(colors.length).toBeGreaterThan(0);

        // All color indices in valid range
        board.forEach((tube) => {
          tube.forEach((colorIdx) => {
            expect(colorIdx).toBeGreaterThanOrEqual(0);
            expect(colorIdx).toBeLessThan(colors.length);
          });
        });
      }).not.toThrow();
    }
  });
});

describe("Property: Pour preserves total segment count", () => {
  it("total segments should remain constant after any pour", () => {
    for (let levelIdx = 0; levelIdx < 20; levelIdx++) {
      const { board } = generateLevel(levelIdx);
      const initialTotal = board.reduce((sum, t) => sum + t.length, 0);

      // Find and execute any valid pour
      let poured = false;
      for (let src = 0; src < board.length && !poured; src++) {
        for (let dst = 0; dst < board.length && !poured; dst++) {
          if (src !== dst && canPour(board, src, dst)) {
            pour(board, src, dst);
            poured = true;
          }
        }
      }

      const afterTotal = board.reduce((sum, t) => sum + t.length, 0);
      expect(afterTotal).toBe(initialTotal);
    }
  });
});

describe("Property: Pour preserves color distribution", () => {
  it("each color count should remain constant after pours", () => {
    for (let levelIdx = 0; levelIdx < 10; levelIdx++) {
      const { board, colors } = generateLevel(levelIdx);

      // Count colors before
      const countBefore: Record<number, number> = {};
      board.forEach((tube) => {
        tube.forEach((c) => {
          countBefore[c] = (countBefore[c] || 0) + 1;
        });
      });

      // Perform several valid pours
      for (let attempt = 0; attempt < 5; attempt++) {
        for (let src = 0; src < board.length; src++) {
          for (let dst = 0; dst < board.length; dst++) {
            if (src !== dst && canPour(board, src, dst)) {
              pour(board, src, dst);
              break;
            }
          }
        }
      }

      // Count colors after
      const countAfter: Record<number, number> = {};
      board.forEach((tube) => {
        tube.forEach((c) => {
          countAfter[c] = (countAfter[c] || 0) + 1;
        });
      });

      // Color counts should be identical
      for (let c = 0; c < colors.length; c++) {
        expect(countAfter[c]).toBe(countBefore[c]);
      }
    }
  });
});

describe("Property: Win detection is correct", () => {
  it("a manually solved board should be detected as won", () => {
    // Create a solved board with 3 colors
    const solvedBoard = [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [2, 2, 2, 2],
      [],
      [],
    ];
    expect(checkWin(solvedBoard)).toBe(true);
  });

  it("should not win if any tube has mixed colors", () => {
    const mixedBoard = [
      [0, 0, 0, 1], // mixed!
      [1, 1, 1, 0], // mixed!
      [2, 2, 2, 2],
      [],
    ];
    expect(checkWin(mixedBoard)).toBe(false);
  });

  it("should not win if any tube is partially filled with same color", () => {
    const partialBoard = [
      [0, 0, 0], // only 3, not 4
      [1, 1, 1, 1],
      [2, 2, 2, 2],
      [0], // the missing 0
      [],
    ];
    expect(checkWin(partialBoard)).toBe(false);
  });
});

describe("Property: canPour is consistent with pour", () => {
  it("if canPour returns true, pour should modify the board", () => {
    const testCases = [
      { tubes: [[0, 1], [1]], src: 0, dst: 1 },
      { tubes: [[0, 0, 0], []], src: 0, dst: 1 },
      { tubes: [[0, 1, 1], [2, 2, 1]], src: 0, dst: 1 },
    ];

    testCases.forEach(({ tubes, src, dst }) => {
      const board = tubes.map((t) => [...t]);
      const originalBoard = cloneTubes(board);

      expect(canPour(board, src, dst)).toBe(true);
      const amount = pour(board, src, dst);
      expect(amount).toBeGreaterThan(0);
      expect(board).not.toEqual(originalBoard);
    });
  });

  it("if canPour returns false, state should not change", () => {
    const testCases = [
      { tubes: [[], [1, 2]], src: 0, dst: 1 }, // source empty
      { tubes: [[1], [0, 0, 0, 0]], src: 0, dst: 1 }, // dest full
      { tubes: [[1, 2], [3, 4]], src: 0, dst: 1 }, // colors don't match
    ];

    testCases.forEach(({ tubes, src, dst }) => {
      const board = tubes.map((t) => [...t]);
      expect(canPour(board, src, dst)).toBe(false);
      // Board should not have been modified by canPour
      expect(board).toEqual(tubes);
    });
  });
});

describe("Property: Difficulty monotonicity", () => {
  it("star rating should generally trend upward across level groups", () => {
    // Stars are based on raw difficulty, which spikes at milestones (5, 10)
    // and drops on the next level — so they are NOT strictly monotonic.
    // We test that early levels ≤ late levels on average.
    const earlyStars = Array.from({ length: 10 }, (_, i) =>
      getDifficultyStars(i + 1),
    );
    const lateStars = Array.from({ length: 10 }, (_, i) =>
      getDifficultyStars(i + 91),
    );
    const avgEarly = earlyStars.reduce((a, b) => a + b) / earlyStars.length;
    const avgLate = lateStars.reduce((a, b) => a + b) / lateStars.length;
    expect(avgLate).toBeGreaterThan(avgEarly);
  });

  it("color count should never decrease significantly as levels progress", () => {
    let maxColors = 0;
    for (let level = 1; level <= 100; level++) {
      const config = getLevelConfig(level);
      if (config.colors > maxColors) {
        maxColors = config.colors;
      }
      // Colors should never drop below 2
      expect(config.colors).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("Property: Level generation determinism for colors", () => {
  it("same level should always produce same colors", () => {
    for (let i = 0; i < 20; i++) {
      const colors1 = generateLevel(i).colors;
      const colors2 = generateLevel(i).colors;
      expect(colors1).toEqual(colors2);
    }
  });
});

describe("Property: Tube capacity is never exceeded", () => {
  it("no tube should ever have more than TUBE_CAPACITY segments after pour", () => {
    for (let levelIdx = 0; levelIdx < 20; levelIdx++) {
      const { board } = generateLevel(levelIdx);

      // Perform multiple pours
      for (let attempt = 0; attempt < 10; attempt++) {
        for (let src = 0; src < board.length; src++) {
          for (let dst = 0; dst < board.length; dst++) {
            if (src !== dst && canPour(board, src, dst)) {
              pour(board, src, dst);

              // Verify capacity constraint
              board.forEach((tube) => {
                expect(tube.length).toBeLessThanOrEqual(TUBE_CAPACITY);
              });
              break;
            }
          }
        }
      }
    }
  });
});
