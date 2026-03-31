/**
 * Main.ts animation blocking tests.
 *
 * Tests the `isAnimating` guard branches in main.ts:
 * - Line 44: tube click blocked during animation
 * - Line 144: undo blocked during animation
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

describe("Main.ts: isAnimating guard in onTubeClick (line 44)", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    setupFullDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should block tube clicks during animation", async () => {
    // Create a deferred promise to control animation timing
    let resolveAnimation: () => void = () => {};
    const animationPromise = new Promise<void>((resolve) => {
      resolveAnimation = resolve;
    });

    vi.doMock("../src/ui/animations", () => ({
      animatePour: () => animationPromise,
    }));

    // Use a board where we can do a pour
    vi.doMock("../src/core/level-generator", () => ({
      generateLevel: () => ({
        board: [
          [0, 0, 1, 1],  // Mixed
          [1, 1, 0, 0],  // Mixed
          [],             // Empty
          [],             // Empty
        ],
        colors: ["#ff0000", "#00ff00"],
      }),
    }));

    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    // Select tube 0 (top color: 1)
    let tubes = document.querySelectorAll("#tubes-container .tube");
    (tubes[0] as HTMLElement).click();

    // Pour into tube 2 (empty) - this triggers animation
    tubes = document.querySelectorAll("#tubes-container .tube");
    (tubes[2] as HTMLElement).click();

    // At this point, isAnimating should be true
    // The moves display should show 1
    expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 1");

    // Now try to click another tube while animating
    // This should be blocked by the isAnimating guard
    tubes = document.querySelectorAll("#tubes-container .tube");
    const movesBefore = document.getElementById("moves-display")!.textContent;
    (tubes[1] as HTMLElement).click();

    // Moves should not have changed (click was blocked)
    expect(document.getElementById("moves-display")!.textContent).toBe(movesBefore);

    // Now resolve the animation
    resolveAnimation();

    // Wait for the animation to complete and state to update
    await vi.waitFor(() => {
      // After animation, isAnimating should be false
      // Moves should still be 1
      expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 1");
    });
  });
});

describe("Main.ts: isAnimating guard in undo handler (line 144)", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    setupFullDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should block undo during animation", async () => {
    let resolveAnimation: () => void = () => {};
    const animationPromise = new Promise<void>((resolve) => {
      resolveAnimation = resolve;
    });

    vi.doMock("../src/ui/animations", () => ({
      animatePour: () => animationPromise,
    }));

    vi.doMock("../src/core/level-generator", () => ({
      generateLevel: () => ({
        board: [
          [0, 0, 1, 1],
          [1, 1, 0, 0],
          [],
          [],
        ],
        colors: ["#ff0000", "#00ff00"],
      }),
    }));

    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    // Perform a pour to create history
    let tubes = document.querySelectorAll("#tubes-container .tube");
    (tubes[0] as HTMLElement).click();
    tubes = document.querySelectorAll("#tubes-container .tube");
    (tubes[2] as HTMLElement).click();

    // Animation is now in progress, isAnimating = true
    expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 1");

    // Try to undo while animating - should be blocked
    document.getElementById("undo-btn")!.click();

    // Moves should still be 1 (undo was blocked)
    expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 1");

    // Resolve animation
    resolveAnimation();

    // Wait for animation to complete
    await vi.waitFor(() => {
      expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 1");
    });

    // Now undo should work
    document.getElementById("undo-btn")!.click();
    expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 0");
  });
});
