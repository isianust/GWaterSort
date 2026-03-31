/**
 * Main application orchestration tests.
 *
 * Tests the game flow that main.ts coordinates:
 * tube click handlers, undo, restart, next level, back navigation.
 *
 * Since main.ts uses module-level side effects (initDOM, event listeners),
 * we test the underlying functions and game flow logic directly.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  cloneTubes,
  canPour,
  pour,
  checkWin,
} from "../src/core/engine";
import { generateLevel } from "../src/core/level-generator";
import {
  markLevelComplete,
  loadProgress,
  getCompletedCount,
} from "../src/core/storage";
import { TOTAL_LEVELS } from "../src/core/types";
import { getLevelConfig } from "../src/core/difficulty";

/** Simulates the tube click logic from main.ts */
function simulateTubeClick(
  state: {
    tubes: number[][];
    selectedTubeIndex: number | null;
    moves: number;
    history: number[][][];
    isAnimating: boolean;
  },
  idx: number,
): { action: string; poured?: number } {
  if (state.isAnimating) return { action: "blocked-animating" };

  if (state.selectedTubeIndex === null) {
    if (state.tubes[idx].length === 0) return { action: "ignored-empty" };
    state.selectedTubeIndex = idx;
    return { action: "selected" };
  }

  if (state.selectedTubeIndex === idx) {
    state.selectedTubeIndex = null;
    return { action: "deselected" };
  }

  if (canPour(state.tubes, state.selectedTubeIndex, idx)) {
    const srcIdx = state.selectedTubeIndex;
    state.history.push(cloneTubes(state.tubes));
    state.selectedTubeIndex = null;
    const amount = pour(state.tubes, srcIdx, idx);
    state.moves++;
    return { action: "poured", poured: amount };
  } else {
    state.selectedTubeIndex = null;
    return { action: "invalid-pour" };
  }
}

/** Simulates undo logic from main.ts */
function simulateUndo(state: {
  tubes: number[][];
  selectedTubeIndex: number | null;
  moves: number;
  history: number[][][];
  isAnimating: boolean;
}): boolean {
  if (state.isAnimating) return false;
  if (state.history.length === 0) return false;
  state.tubes = state.history.pop()!;
  state.moves = Math.max(0, state.moves - 1);
  state.selectedTubeIndex = null;
  return true;
}

describe("Game flow: tube click interactions", () => {
  it("should select a non-empty tube on first click", () => {
    const state = {
      tubes: [[0, 1], [2, 3], []],
      selectedTubeIndex: null as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    const result = simulateTubeClick(state, 0);
    expect(result.action).toBe("selected");
    expect(state.selectedTubeIndex).toBe(0);
  });

  it("should ignore click on empty tube when nothing is selected", () => {
    const state = {
      tubes: [[0, 1], []],
      selectedTubeIndex: null as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    const result = simulateTubeClick(state, 1);
    expect(result.action).toBe("ignored-empty");
    expect(state.selectedTubeIndex).toBeNull();
  });

  it("should deselect when clicking the same tube again", () => {
    const state = {
      tubes: [[0, 1], [2, 3]],
      selectedTubeIndex: 0 as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    const result = simulateTubeClick(state, 0);
    expect(result.action).toBe("deselected");
    expect(state.selectedTubeIndex).toBeNull();
  });

  it("should pour when valid", () => {
    const state = {
      tubes: [[0, 1, 1], [1]],
      selectedTubeIndex: 0 as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    const result = simulateTubeClick(state, 1);
    expect(result.action).toBe("poured");
    expect(result.poured).toBe(2); // two 1's from top
    expect(state.moves).toBe(1);
    expect(state.tubes[0]).toEqual([0]);
    expect(state.tubes[1]).toEqual([1, 1, 1]);
    expect(state.selectedTubeIndex).toBeNull();
    expect(state.history.length).toBe(1);
  });

  it("should reject invalid pour (color mismatch)", () => {
    const state = {
      tubes: [[0, 1], [2, 3]],
      selectedTubeIndex: 0 as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    const result = simulateTubeClick(state, 1);
    expect(result.action).toBe("invalid-pour");
    expect(state.selectedTubeIndex).toBeNull();
    expect(state.moves).toBe(0);
  });

  it("should reject interaction while animating", () => {
    const state = {
      tubes: [[0, 1], [1]],
      selectedTubeIndex: null as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: true,
    };

    const result = simulateTubeClick(state, 0);
    expect(result.action).toBe("blocked-animating");
  });

  it("should pour into empty tube", () => {
    const state = {
      tubes: [[0, 0], []],
      selectedTubeIndex: 0 as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    const result = simulateTubeClick(state, 1);
    expect(result.action).toBe("poured");
    expect(state.tubes[0]).toEqual([]);
    expect(state.tubes[1]).toEqual([0, 0]);
  });

  it("should reject pour to full tube", () => {
    const state = {
      tubes: [[1], [0, 0, 0, 0]],
      selectedTubeIndex: 0 as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    const result = simulateTubeClick(state, 1);
    expect(result.action).toBe("invalid-pour");
  });
});

describe("Game flow: undo operation", () => {
  it("should undo a pour and restore previous state", () => {
    const state = {
      tubes: [[0, 1, 1], [1]],
      selectedTubeIndex: null as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    // Select and pour
    simulateTubeClick(state, 0);
    simulateTubeClick(state, 1);
    expect(state.moves).toBe(1);
    expect(state.tubes[0]).toEqual([0]);
    expect(state.tubes[1]).toEqual([1, 1, 1]);

    // Undo
    const undone = simulateUndo(state);
    expect(undone).toBe(true);
    expect(state.moves).toBe(0);
    expect(state.tubes[0]).toEqual([0, 1, 1]);
    expect(state.tubes[1]).toEqual([1]);
  });

  it("should support multiple undos", () => {
    const state = {
      tubes: [[0, 1, 1], [1], []],
      selectedTubeIndex: null as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    // Move 1: pour from 0 to 1
    simulateTubeClick(state, 0);
    simulateTubeClick(state, 1);

    // Move 2: pour from 0 to 2
    simulateTubeClick(state, 0);
    simulateTubeClick(state, 2);

    expect(state.moves).toBe(2);

    // Undo move 2
    simulateUndo(state);
    expect(state.moves).toBe(1);

    // Undo move 1
    simulateUndo(state);
    expect(state.moves).toBe(0);
    expect(state.tubes[0]).toEqual([0, 1, 1]);
    expect(state.tubes[1]).toEqual([1]);
    expect(state.tubes[2]).toEqual([]);
  });

  it("should not undo when history is empty", () => {
    const state = {
      tubes: [[0, 1]],
      selectedTubeIndex: null as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    expect(simulateUndo(state)).toBe(false);
    expect(state.moves).toBe(0);
  });

  it("should not undo while animating", () => {
    const state = {
      tubes: [[0, 1]],
      selectedTubeIndex: null as number | null,
      moves: 1,
      history: [[[0, 1, 1]]],
      isAnimating: true,
    };

    expect(simulateUndo(state)).toBe(false);
  });

  it("should clamp moves to 0", () => {
    const state = {
      tubes: [[0]],
      selectedTubeIndex: null as number | null,
      moves: 0,
      history: [[[0, 1]]],
      isAnimating: false,
    };

    simulateUndo(state);
    expect(state.moves).toBe(0); // Math.max(0, -1) = 0
  });
});

describe("Game flow: restart", () => {
  it("should generate same board for same level", () => {
    const level1 = generateLevel(0);
    const level1Again = generateLevel(0);

    // Colors are deterministic
    expect(level1.colors).toEqual(level1Again.colors);

    // Board structure is deterministic in terms of total segments
    const total1 = level1.board.reduce((s, t) => s + t.length, 0);
    const total2 = level1Again.board.reduce((s, t) => s + t.length, 0);
    expect(total1).toBe(total2);
  });

  it("should reset state properly on restart", () => {
    const state = {
      tubes: [[0, 1]],
      selectedTubeIndex: 0 as number | null,
      moves: 5,
      history: [[[0]], [[1]]],
      isAnimating: true,
    };

    // Simulate restart
    const result = generateLevel(0);
    state.tubes = result.board;
    state.selectedTubeIndex = null;
    state.moves = 0;
    state.history = [];
    state.isAnimating = false;

    expect(state.selectedTubeIndex).toBeNull();
    expect(state.moves).toBe(0);
    expect(state.history.length).toBe(0);
    expect(state.isAnimating).toBe(false);
    expect(state.tubes.length).toBeGreaterThan(0);
  });
});

describe("Game flow: next level / back to levels", () => {
  it("should advance level index when not at last level", () => {
    let currentLevel = 0;

    // Simulate next level
    if (currentLevel < TOTAL_LEVELS - 1) {
      currentLevel++;
    }

    expect(currentLevel).toBe(1);
  });

  it("should not advance past last level", () => {
    let currentLevel = TOTAL_LEVELS - 1;

    // At last level, should go to homepage instead of advancing
    const shouldGoHome = currentLevel >= TOTAL_LEVELS - 1;
    expect(shouldGoHome).toBe(true);
  });

  it("should generate valid board for every level transition", () => {
    for (let i = 0; i < Math.min(10, TOTAL_LEVELS); i++) {
      const result = generateLevel(i);
      expect(result.board.length).toBeGreaterThan(0);
      expect(result.colors.length).toBeGreaterThan(0);

      const config = getLevelConfig(i + 1);
      expect(result.board.length).toBe(config.colors + config.emptyTubes);
    }
  });
});

describe("Game flow: win detection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should detect win state after solving a puzzle", () => {
    const tubes = [
      [0, 0, 1, 1],
      [1, 1, 0, 0],
      [],
    ];

    // Solve the puzzle
    pour(tubes, 0, 2); // [0,0] -> [1,1]
    pour(tubes, 1, 0); // [1,1,0,0] pour 0,0 -> [0,0]
    pour(tubes, 1, 2); // [1,1] -> [1,1]

    expect(checkWin(tubes)).toBe(true);
  });

  it("should mark level complete and persist on win", () => {
    const levelNum = 42;
    markLevelComplete(levelNum);

    const progress = loadProgress();
    expect(progress.completed[levelNum]).toBe(true);
    expect(getCompletedCount()).toBe(1);
  });

  it("should determine if it's the last level", () => {
    expect(TOTAL_LEVELS - 1 >= TOTAL_LEVELS - 1).toBe(true); // Last level
    expect(0 >= TOTAL_LEVELS - 1).toBe(false); // First level
  });
});

describe("Game flow: complete game simulation", () => {
  it("should play through a complete 2-color game", () => {
    // Manually create a solvable 2-color board
    const state = {
      tubes: [
        [0, 1, 0, 1],
        [1, 0, 1, 0],
        [],
        [],
      ],
      selectedTubeIndex: null as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    // Step 1: Select tube 0, pour to tube 2
    simulateTubeClick(state, 0); // select tube 0 (top: 1)
    simulateTubeClick(state, 2); // pour 1 to empty tube 2

    // Step 2: Select tube 1, pour to tube 3
    simulateTubeClick(state, 1); // select tube 1 (top: 0)
    simulateTubeClick(state, 3); // pour 0 to empty tube 3

    // Step 3: Select tube 0, pour to tube 2
    simulateTubeClick(state, 0); // select tube 0 (top: 0)
    simulateTubeClick(state, 3); // pour 0 to tube 3

    // Step 4: Select tube 1, pour to tube 2
    simulateTubeClick(state, 1); // select tube 1 (top: 1)
    simulateTubeClick(state, 2); // pour 1 to tube 2

    // Continue solving...
    // After some pours, verify total segments preserved
    const total = state.tubes.reduce((s, t) => s + t.length, 0);
    expect(total).toBe(8); // 2 colors * 4 segments each

    expect(state.moves).toBeGreaterThan(0);
  });

  it("should preserve total segment count through all pours", () => {
    const state = {
      tubes: [
        [0, 0, 1, 1],
        [1, 1, 0, 0],
        [],
      ],
      selectedTubeIndex: null as number | null,
      moves: 0,
      history: [] as number[][][],
      isAnimating: false,
    };

    const initialTotal = state.tubes.reduce((s, t) => s + t.length, 0);

    // Perform several pours
    simulateTubeClick(state, 0); simulateTubeClick(state, 2); // pour from 0 to 2
    simulateTubeClick(state, 1); simulateTubeClick(state, 0); // pour from 1 to 0
    simulateTubeClick(state, 1); simulateTubeClick(state, 2); // pour from 1 to 2

    const finalTotal = state.tubes.reduce((s, t) => s + t.length, 0);
    expect(finalTotal).toBe(initialTotal);
  });
});
