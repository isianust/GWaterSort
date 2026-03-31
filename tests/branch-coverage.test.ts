/**
 * Branch coverage gap tests.
 *
 * Targets specific uncovered branches in the codebase:
 * - difficulty.ts:73 – numColors < 2 guard (branch where guard activates)
 * - animations.ts:83 – drop.parentNode null check
 * - renderer.ts – shakeTube with no matching tube element
 * - engine.ts – canPour various branch combinations
 * - level-generator.ts – isPuzzleTrivial single-color case
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { canPour, pour, topRunLength, topColor, isTubeSolved, checkWin } from "../src/core/engine";
import { isPuzzleTrivial } from "../src/core/level-generator";

describe("Branch coverage: difficulty numColors guard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("should force numColors < 2 guard to activate with negative base", async () => {
    // By mocking DIFFICULTY_COLOR_DIVISOR to be negative or making the
    // formula produce < 2, we can test the guard directly
    vi.doMock("../src/core/types", async (importOriginal) => {
      const orig = (await importOriginal()) as Record<string, unknown>;
      return {
        ...orig,
        // When DIFFICULTY_COLOR_DIVISOR is negative, Math.floor(diff / -1)
        // yields -diff, so numColors = 2 + (-1) = 1, which triggers the guard
        DIFFICULTY_COLOR_DIVISOR: -1,
        MAX_COLORS: 20,
        HIGH_DIFFICULTY_THRESHOLD: 60,
      };
    });

    const { getLevelConfig } = await import("../src/core/difficulty");
    const config = getLevelConfig(1);
    // Despite the negative divisor, guard should enforce minimum 2
    expect(config.colors).toBe(2);
  });
});

describe("Branch coverage: animations drop.parentNode null", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should handle drop element that was already removed from DOM", async () => {
    // Create a container with two tubes
    const container = document.createElement("div");
    const mockRect = {
      top: 100, left: 50, right: 100, bottom: 200,
      width: 50, height: 100, x: 50, y: 100,
      toJSON: () => ({}),
    };

    const tube1 = document.createElement("div");
    tube1.className = "tube";
    tube1.getBoundingClientRect = () => mockRect;

    const tube2 = document.createElement("div");
    tube2.className = "tube";
    tube2.getBoundingClientRect = () => ({
      ...mockRect, left: 150, right: 200, x: 150,
    });

    container.appendChild(tube1);
    container.appendChild(tube2);
    document.body.appendChild(container);

    const { animatePour } = await import("../src/ui/animations");

    // Start animation
    const promise = animatePour(container, 0, 1, "#ff0000", 1, 1);

    // Get the drop element and remove it prematurely (before animation finishes)
    const drop = document.body.querySelector(".water-drop");
    if (drop && drop.parentNode) {
      drop.parentNode.removeChild(drop);
    }

    // Should still resolve without error
    await promise;
    expect(document.body.querySelector(".water-drop")).toBeNull();
  }, 10000);
});

describe("Branch coverage: canPour edge combinations", () => {
  it("should reject pour when src is empty and dst is also empty", () => {
    const tubes = [[], []];
    expect(canPour(tubes, 0, 1)).toBe(false);
  });

  it("should allow pour when src has 1 segment and dst has matching color with 3 segments", () => {
    const tubes = [[1], [1, 1, 1]];
    expect(canPour(tubes, 0, 1)).toBe(true);
  });

  it("should reject pour when src has segment but dst is full at exact capacity", () => {
    const tubes = [[0], [0, 0, 0, 0]];
    expect(canPour(tubes, 0, 1)).toBe(false);
  });

  it("should reject pour with matching colors when dst is at capacity", () => {
    // Even though colors match, destination is full
    const tubes = [[0, 0], [0, 0, 0, 0]];
    expect(canPour(tubes, 0, 1)).toBe(false);
  });

  it("should allow pour to empty tube regardless of color", () => {
    const tubes = [[5, 5, 5, 5], []];
    expect(canPour(tubes, 0, 1)).toBe(true);
  });

  it("should handle pour when src has mixed colors - only pours matching top run", () => {
    const tubes = [[0, 1, 1], [1]];
    expect(canPour(tubes, 0, 1)).toBe(true);

    const amount = pour(tubes, 0, 1);
    expect(amount).toBe(2); // Only pours the two 1s from top
    expect(tubes[0]).toEqual([0]);
    expect(tubes[1]).toEqual([1, 1, 1]);
  });
});

describe("Branch coverage: topRunLength and topColor", () => {
  it("should return 0 for empty tube topRunLength", () => {
    expect(topRunLength([])).toBe(0);
  });

  it("should return null for empty tube topColor", () => {
    expect(topColor([])).toBeNull();
  });

  it("should handle tube with all different colors", () => {
    expect(topRunLength([0, 1, 2, 3])).toBe(1);
    expect(topColor([0, 1, 2, 3])).toBe(3);
  });

  it("should handle tube with 3 same on top, 1 different at bottom", () => {
    expect(topRunLength([0, 1, 1, 1])).toBe(3);
  });

  it("should handle tube with alternating colors", () => {
    expect(topRunLength([0, 1, 0, 1])).toBe(1);
  });
});

describe("Branch coverage: isTubeSolved edge cases", () => {
  it("should return false for tube with exactly 3 of same color", () => {
    expect(isTubeSolved([1, 1, 1])).toBe(false);
  });

  it("should return false for tube with 4 segments but two colors", () => {
    expect(isTubeSolved([0, 0, 1, 1])).toBe(false);
  });

  it("should return true for tube with exactly 4 of same color", () => {
    expect(isTubeSolved([2, 2, 2, 2])).toBe(true);
  });

  it("should return false for overfull tube (5 segments)", () => {
    // Should not happen in practice, but test the guard
    expect(isTubeSolved([0, 0, 0, 0, 0])).toBe(false);
  });
});

describe("Branch coverage: checkWin edge cases", () => {
  it("should return true for board with all solved and all empty", () => {
    expect(checkWin([[0, 0, 0, 0], [1, 1, 1, 1], [], []])).toBe(true);
  });

  it("should return true for board with only empty tubes", () => {
    expect(checkWin([[], [], []])).toBe(true);
  });

  it("should return false when one tube has partial fill", () => {
    expect(checkWin([[0, 0, 0, 0], [1, 1], []])).toBe(false);
  });

  it("should return true for empty board", () => {
    expect(checkWin([])).toBe(true);
  });

  it("should return false when one tube has mixed colors at capacity", () => {
    expect(checkWin([[0, 1, 0, 1], [0, 0, 0, 0], []])).toBe(false);
  });
});

describe("Branch coverage: isPuzzleTrivial edge cases", () => {
  it("should handle 4 colors puzzle", () => {
    const trivial = [
      0, 0, 0, 0,
      1, 1, 1, 1,
      2, 2, 2, 2,
      3, 3, 3, 3,
    ];
    expect(isPuzzleTrivial(trivial, 4)).toBe(true);

    const mixed = [
      0, 1, 0, 0,
      1, 1, 1, 0,
      2, 2, 2, 2,
      3, 3, 3, 3,
    ];
    expect(isPuzzleTrivial(mixed, 4)).toBe(false);
  });

  it("should handle minimum 1 color", () => {
    expect(isPuzzleTrivial([0, 0, 0, 0], 1)).toBe(true);
  });

  it("should detect first non-same tube and return false early", () => {
    // First tube is mixed, so returns false without checking remaining tubes
    const segments = [0, 1, 0, 0, 1, 1, 1, 1];
    expect(isPuzzleTrivial(segments, 2)).toBe(false);
  });
});

describe("Branch coverage: pour amount calculations", () => {
  it("should pour only 1 segment when run=3 but space=1", () => {
    const tubes = [[0, 1, 1, 1], [2, 2, 2]];
    // src top run = 3 (three 1s), dst space = 1
    expect(canPour(tubes, 0, 1)).toBe(false); // colors don't match

    const tubes2 = [[0, 1, 1, 1], [2, 2, 1]];
    expect(canPour(tubes2, 0, 1)).toBe(true);
    const amount = pour(tubes2, 0, 1);
    expect(amount).toBe(1); // space is 1
    expect(tubes2[0]).toEqual([0, 1, 1]);
    expect(tubes2[1]).toEqual([2, 2, 1, 1]);
  });

  it("should pour entire run when space is sufficient", () => {
    const tubes = [[0, 1, 1], []];
    const amount = pour(tubes, 0, 1);
    expect(amount).toBe(2); // run=2, space=4, min=2
    expect(tubes[0]).toEqual([0]);
    expect(tubes[1]).toEqual([1, 1]);
  });

  it("should pour 4 segments when full tube of one color pours into empty", () => {
    const tubes = [[0, 0, 0, 0], []];
    const amount = pour(tubes, 0, 1);
    expect(amount).toBe(4); // run=4, space=4
    expect(tubes[0]).toEqual([]);
    expect(tubes[1]).toEqual([0, 0, 0, 0]);
  });
});
