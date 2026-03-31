/**
 * Main.ts win flow and next-level integration tests.
 *
 * Tests the code paths in main.ts that handle:
 * - onWin() being called after checkWin detects a win
 * - nextLevelBtn click advancing to next level
 * - nextLevelBtn click going to homepage when at last level
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

function setupFullDOM(): void {
  document.body.innerHTML = `
    <div id="homepage">
      <h1>Water Color Sort</h1>
      <p id="total-levels-info"></p>
      <p id="progress-info"></p>
      <div id="level-grid"></div>
    </div>
    <div id="game-container" class="hidden">
      <div id="game-header">
        <button id="back-btn">← Levels</button>
        <h1>Water Color Sort</h1>
      </div>
      <div id="status-bar">
        <span id="level-display">Level: 1</span>
        <span id="difficulty-display">Difficulty: ★</span>
        <span id="moves-display">Moves: 0</span>
      </div>
      <div id="tubes-container"></div>
      <div id="win-message" class="hidden">
        <h2>You Win!</h2>
        <p id="win-details"></p>
        <button id="next-level-btn">Next Level</button>
      </div>
      <div id="controls">
        <button id="undo-btn">Undo</button>
        <button id="restart-btn">Restart Level</button>
      </div>
    </div>
  `;
}

describe("Main win flow: win detection triggers onWin", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    setupFullDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should show win message and mark level complete when puzzle is solved", async () => {
    // Mock generateLevel to return a nearly-solved puzzle
    // Board: tube 0 has [0,0,0,0], tube 1 has [1,1,1], tube 2 has [1], tube 3 is empty
    // Pour from tube 2 to tube 1 completes the puzzle
    vi.doMock("../src/core/level-generator", () => ({
      generateLevel: () => ({
        board: [
          [0, 0, 0, 0],  // Solved
          [1, 1, 1],      // Needs one more 1
          [1],             // Has the final 1
          [],              // Empty
        ],
        colors: ["#ff0000", "#00ff00"],
      }),
    }));

    // Mock animatePour to resolve immediately
    vi.doMock("../src/ui/animations", () => ({
      animatePour: () => Promise.resolve(),
    }));

    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    // Verify game view is shown
    expect(document.getElementById("game-container")!.classList.contains("hidden")).toBe(false);

    // Find tubes
    const tubes = document.querySelectorAll("#tubes-container .tube");
    expect(tubes.length).toBe(4);

    // Tube 2 has 1 segment (color index 1), tube 1 has 3 segments (color index 1)
    // Select tube 2 (the one with 1 segment)
    (tubes[2] as HTMLElement).click();

    // Now pour into tube 1
    const updated = document.querySelectorAll("#tubes-container .tube");
    (updated[1] as HTMLElement).click();

    // Wait for the mocked animation to resolve and win detection to fire
    await vi.waitFor(() => {
      const winMsg = document.getElementById("win-message")!;
      expect(winMsg.classList.contains("hidden")).toBe(false);
    });

    // Win details should show completion message
    const winDetails = document.getElementById("win-details")!;
    expect(winDetails.textContent).toContain("move");

    // Level should be marked complete in localStorage
    const progress = JSON.parse(localStorage.getItem("waterSortProgress") || "{}");
    expect(progress.completed[1]).toBe(true);

    // Next level button should say "Next Level" (not last level)
    expect(document.getElementById("next-level-btn")!.textContent).toBe("Next Level");
  });

  it("should advance to next level when next-level button is clicked after win", async () => {
    // Mock a nearly-solved puzzle
    vi.doMock("../src/core/level-generator", () => ({
      generateLevel: (levelIndex: number) => {
        if (levelIndex === 0) {
          return {
            board: [[0, 0, 0, 0], [1, 1, 1], [1], []],
            colors: ["#ff0000", "#00ff00"],
          };
        }
        // Level 2 returns a normal board
        return {
          board: [[0, 0, 1, 1], [1, 1, 0, 0], [], []],
          colors: ["#0000ff", "#ffff00"],
        };
      },
    }));

    vi.doMock("../src/ui/animations", () => ({
      animatePour: () => Promise.resolve(),
    }));

    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    // Solve the puzzle
    const tubes = document.querySelectorAll("#tubes-container .tube");
    (tubes[2] as HTMLElement).click(); // Select tube with [1]
    const updated = document.querySelectorAll("#tubes-container .tube");
    (updated[1] as HTMLElement).click(); // Pour to tube with [1,1,1]

    // Wait for win
    await vi.waitFor(() => {
      expect(document.getElementById("win-message")!.classList.contains("hidden")).toBe(false);
    });

    // Click "Next Level"
    document.getElementById("next-level-btn")!.click();

    // Should now be on Level 2
    expect(document.getElementById("level-display")!.textContent).toBe("Level: 2");
    expect(document.getElementById("win-message")!.classList.contains("hidden")).toBe(true);
  });
});

describe("Main win flow: last level handling", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    setupFullDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should show 'Back to Levels' on last level win and navigate to homepage on click", async () => {
    // Mock generateLevel to return a nearly-solved puzzle for level 100 (index 99)
    vi.doMock("../src/core/level-generator", () => ({
      generateLevel: () => ({
        board: [[0, 0, 0, 0], [1, 1, 1], [1], []],
        colors: ["#ff0000", "#00ff00"],
      }),
    }));

    vi.doMock("../src/ui/animations", () => ({
      animatePour: () => Promise.resolve(),
    }));

    await import("../src/main");

    // Start last level (level 100 = index 99)
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[99] as HTMLElement).click();

    // Solve it
    const tubes = document.querySelectorAll("#tubes-container .tube");
    (tubes[2] as HTMLElement).click();
    const updated = document.querySelectorAll("#tubes-container .tube");
    (updated[1] as HTMLElement).click();

    // Wait for win
    await vi.waitFor(() => {
      expect(document.getElementById("win-message")!.classList.contains("hidden")).toBe(false);
    });

    // Should say "Back to Levels" since this is the last level
    expect(document.getElementById("next-level-btn")!.textContent).toBe("Back to Levels");

    // Click "Back to Levels"
    document.getElementById("next-level-btn")!.click();

    // Should be back on homepage
    expect(document.getElementById("homepage")!.classList.contains("hidden")).toBe(false);
    expect(document.getElementById("game-container")!.classList.contains("hidden")).toBe(true);
  });
});

describe("Main win flow: next level button without win (direct navigation)", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    setupFullDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should advance level when next level button clicked", async () => {
    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    expect(document.getElementById("level-display")!.textContent).toBe("Level: 1");

    // Click next level button directly (simulating already-won state)
    document.getElementById("next-level-btn")!.click();

    // Should now be on Level 2
    expect(document.getElementById("level-display")!.textContent).toBe("Level: 2");
  });

  it("should go to homepage when next level clicked on last level", async () => {
    await import("../src/main");

    // Start level 100 (index 99)
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[99] as HTMLElement).click();

    expect(document.getElementById("level-display")!.textContent).toBe("Level: 100");

    // Click next level button on last level
    document.getElementById("next-level-btn")!.click();

    // Should be back on homepage
    expect(document.getElementById("homepage")!.classList.contains("hidden")).toBe(false);
    expect(document.getElementById("game-container")!.classList.contains("hidden")).toBe(true);
  });
});
