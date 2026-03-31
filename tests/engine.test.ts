import { describe, it, expect } from "vitest";
import {
  cloneTubes,
  shuffle,
  isTubeSolved,
  topColor,
  topRunLength,
  canPour,
  pour,
  checkWin,
} from "../src/core/engine";

describe("cloneTubes", () => {
  it("should create a deep copy of the game board", () => {
    const original = [[0, 1, 2, 3], [1, 1, 1, 1], []];
    const cloned = cloneTubes(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    // Verify deep copy - modifying clone shouldn't affect original
    cloned[0].push(4);
    expect(original[0]).toEqual([0, 1, 2, 3]);
  });

  it("should handle empty board", () => {
    expect(cloneTubes([])).toEqual([]);
  });

  it("should handle board with empty tubes", () => {
    const board = [[], [], []];
    const cloned = cloneTubes(board);
    expect(cloned).toEqual(board);
    cloned[0].push(1);
    expect(board[0]).toEqual([]);
  });
});

describe("shuffle", () => {
  it("should maintain array length", () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(arr);
    expect(arr).toHaveLength(5);
  });

  it("should contain all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(arr);
    expect(arr.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("should return the same array reference (in-place)", () => {
    const arr = [1, 2, 3];
    const result = shuffle(arr);
    expect(result).toBe(arr);
  });

  it("should handle single element array", () => {
    const arr = [42];
    shuffle(arr);
    expect(arr).toEqual([42]);
  });

  it("should handle empty array", () => {
    const arr: number[] = [];
    shuffle(arr);
    expect(arr).toEqual([]);
  });
});

describe("isTubeSolved", () => {
  it("should return true for a full tube of one color", () => {
    expect(isTubeSolved([0, 0, 0, 0])).toBe(true);
    expect(isTubeSolved([3, 3, 3, 3])).toBe(true);
  });

  it("should return false for mixed colors", () => {
    expect(isTubeSolved([0, 1, 0, 1])).toBe(false);
    expect(isTubeSolved([0, 0, 0, 1])).toBe(false);
  });

  it("should return false for partially filled tube", () => {
    expect(isTubeSolved([0, 0, 0])).toBe(false);
    expect(isTubeSolved([0])).toBe(false);
  });

  it("should return false for empty tube", () => {
    expect(isTubeSolved([])).toBe(false);
  });
});

describe("topColor", () => {
  it("should return the last element (top color)", () => {
    expect(topColor([0, 1, 2])).toBe(2);
    expect(topColor([5])).toBe(5);
  });

  it("should return null for empty tube", () => {
    expect(topColor([])).toBeNull();
  });
});

describe("topRunLength", () => {
  it("should return length of consecutive same-color segments at top", () => {
    expect(topRunLength([0, 1, 1])).toBe(2);
    expect(topRunLength([0, 0, 0, 0])).toBe(4);
    expect(topRunLength([1, 2, 3, 3])).toBe(2);
    expect(topRunLength([0, 1, 2, 3])).toBe(1);
  });

  it("should return 0 for empty tube", () => {
    expect(topRunLength([])).toBe(0);
  });

  it("should return 1 for single element", () => {
    expect(topRunLength([5])).toBe(1);
  });
});

describe("canPour", () => {
  it("should allow pour from non-empty to empty tube", () => {
    const tubes = [[1, 2], []];
    expect(canPour(tubes, 0, 1)).toBe(true);
  });

  it("should allow pour when top colors match", () => {
    const tubes = [[1, 2], [3, 2]];
    expect(canPour(tubes, 0, 1)).toBe(true);
  });

  it("should deny pour from empty tube", () => {
    const tubes = [[], [1, 2]];
    expect(canPour(tubes, 0, 1)).toBe(false);
  });

  it("should deny pour to full tube", () => {
    const tubes = [[1], [0, 0, 0, 0]];
    expect(canPour(tubes, 0, 1)).toBe(false);
  });

  it("should deny pour when top colors don't match", () => {
    const tubes = [[1, 2], [3, 4]];
    expect(canPour(tubes, 0, 1)).toBe(false);
  });
});

describe("pour", () => {
  it("should move matching segments from source to destination", () => {
    const tubes = [[0, 1, 1], [1]];
    const amount = pour(tubes, 0, 1);
    expect(amount).toBe(2);
    expect(tubes[0]).toEqual([0]);
    expect(tubes[1]).toEqual([1, 1, 1]);
  });

  it("should respect tube capacity", () => {
    const tubes = [[0, 1, 1, 1], [1, 1]];
    const amount = pour(tubes, 0, 1);
    // destination has space for 2, source has 3 on top -> pour 2
    expect(amount).toBe(2);
    expect(tubes[0]).toEqual([0, 1]);
    expect(tubes[1]).toEqual([1, 1, 1, 1]);
  });

  it("should pour into empty tube", () => {
    const tubes = [[0, 0], []];
    const amount = pour(tubes, 0, 1);
    expect(amount).toBe(2);
    expect(tubes[0]).toEqual([]);
    expect(tubes[1]).toEqual([0, 0]);
  });

  it("should pour single segment", () => {
    const tubes = [[0, 1], [2, 2, 1]];
    const amount = pour(tubes, 0, 1);
    expect(amount).toBe(1);
    expect(tubes[0]).toEqual([0]);
    expect(tubes[1]).toEqual([2, 2, 1, 1]);
  });
});

describe("checkWin", () => {
  it("should return true when all tubes are solved or empty", () => {
    const tubes = [[0, 0, 0, 0], [1, 1, 1, 1], []];
    expect(checkWin(tubes)).toBe(true);
  });

  it("should return true for all empty tubes", () => {
    const tubes = [[], [], []];
    expect(checkWin(tubes)).toBe(true);
  });

  it("should return false when any tube is not solved", () => {
    const tubes = [[0, 0, 0, 1], [1, 1, 1, 0], []];
    expect(checkWin(tubes)).toBe(false);
  });

  it("should return false for partially filled tubes", () => {
    const tubes = [[0, 0, 0], [1, 1, 1, 1], []];
    expect(checkWin(tubes)).toBe(false);
  });

  it("should handle empty board", () => {
    expect(checkWin([])).toBe(true);
  });
});
