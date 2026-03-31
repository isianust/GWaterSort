/**
 * Main.ts invalid pour path test.
 *
 * Specifically targets lines 92-95 in main.ts:
 * The else branch when canPour returns false (invalid pour + shake).
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

describe("Main invalid pour: shake animation path (lines 92-95)", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    setupFullDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should trigger shake when pouring to a mismatched full tube", async () => {
    // Create a board where invalid pours are guaranteed:
    // Tube 0: [0,0,0,0] - full of color 0
    // Tube 1: [1,1,1,1] - full of color 1
    // Tube 2: [0] - has one segment of color 0
    // Tube 3: [] - empty
    vi.doMock("../src/core/level-generator", () => ({
      generateLevel: () => ({
        board: [
          [0, 0, 0, 0],  // Full with color 0
          [1, 1, 1, 1],  // Full with color 1
          [0, 1, 0, 1],  // Mixed colors
          [],             // Empty
        ],
        colors: ["#ff0000", "#00ff00"],
      }),
    }));

    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    // Verify we're in the game
    expect(document.getElementById("game-container")!.classList.contains("hidden")).toBe(false);

    const tubes = document.querySelectorAll("#tubes-container .tube");
    expect(tubes.length).toBe(4);

    // Select tube 2 (top color is 1)
    (tubes[2] as HTMLElement).click();

    // Verify tube 2 is selected
    let updatedTubes = document.querySelectorAll("#tubes-container .tube");
    expect(updatedTubes[2].classList.contains("selected")).toBe(true);

    // Try to pour into tube 0 (full tube with color 0) - this should fail
    // canPour returns false because dst is full
    (updatedTubes[0] as HTMLElement).click();

    // After invalid pour: tube should get shake class, selection cleared
    updatedTubes = document.querySelectorAll("#tubes-container .tube");
    expect(updatedTubes[0].classList.contains("invalid-shake")).toBe(true);

    // No tube should be selected anymore
    const selectedTubes = document.querySelectorAll("#tubes-container .tube.selected");
    expect(selectedTubes.length).toBe(0);

    // Moves should not have changed
    expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 0");
  });

  it("should trigger shake when pouring mismatched colors", async () => {
    vi.doMock("../src/core/level-generator", () => ({
      generateLevel: () => ({
        board: [
          [0, 0, 0],   // 3 segments color 0
          [1, 1, 1],   // 3 segments color 1
          [0],         // 1 segment color 0
          [1],         // 1 segment color 1
        ],
        colors: ["#ff0000", "#00ff00"],
      }),
    }));

    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    const tubes = document.querySelectorAll("#tubes-container .tube");

    // Select tube 2 (color 0 on top)
    (tubes[2] as HTMLElement).click();

    // Try to pour into tube 1 (color 1 on top) - mismatched colors
    let updatedTubes = document.querySelectorAll("#tubes-container .tube");
    (updatedTubes[1] as HTMLElement).click();

    // Should shake tube 1
    updatedTubes = document.querySelectorAll("#tubes-container .tube");
    expect(updatedTubes[1].classList.contains("invalid-shake")).toBe(true);
  });
});
