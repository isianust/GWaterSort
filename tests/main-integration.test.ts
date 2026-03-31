/**
 * Main.ts integration tests.
 *
 * Tests the full application lifecycle by importing main.ts
 * with a pre-set DOM, and verifying behaviour through DOM events
 * and state inspection.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

/**
 * Set up the complete DOM structure required by main.ts.
 */
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

describe("Main integration: full application lifecycle via DOM", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    setupFullDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize on homepage with level grid rendered", async () => {
    await import("../src/main");

    const homepage = document.getElementById("homepage")!;
    const gameContainer = document.getElementById("game-container")!;

    // Homepage should be visible, game hidden
    expect(homepage.classList.contains("hidden")).toBe(false);
    expect(gameContainer.classList.contains("hidden")).toBe(true);

    // Level grid should have 100 buttons
    const buttons = document.querySelectorAll("#level-grid .level-btn");
    expect(buttons.length).toBe(100);

    // Progress info should display
    const progressInfo = document.getElementById("progress-info")!;
    expect(progressInfo.textContent).toContain("0 / 100");
  });

  it("should start a level when a level button is clicked", async () => {
    await import("../src/main");

    // Click level 1 button
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    expect(levelButtons.length).toBeGreaterThan(0);
    (levelButtons[0] as HTMLElement).click();

    const homepage = document.getElementById("homepage")!;
    const gameContainer = document.getElementById("game-container")!;

    // Game should be visible, homepage hidden
    expect(homepage.classList.contains("hidden")).toBe(true);
    expect(gameContainer.classList.contains("hidden")).toBe(false);

    // Tubes should be rendered
    const tubes = document.querySelectorAll("#tubes-container .tube");
    expect(tubes.length).toBeGreaterThan(0);

    // Level display should say "Level: 1"
    const levelDisplay = document.getElementById("level-display")!;
    expect(levelDisplay.textContent).toBe("Level: 1");

    // Moves should be 0
    const movesDisplay = document.getElementById("moves-display")!;
    expect(movesDisplay.textContent).toBe("Moves: 0");

    // Win message should be hidden
    const winMessage = document.getElementById("win-message")!;
    expect(winMessage.classList.contains("hidden")).toBe(true);
  });

  it("should select a tube on click and deselect on second click", async () => {
    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    const tubeEls = document.querySelectorAll("#tubes-container .tube");
    expect(tubeEls.length).toBeGreaterThan(0);

    // Find a non-empty tube
    let nonEmptyIdx = -1;
    for (let i = 0; i < tubeEls.length; i++) {
      if (tubeEls[i].querySelectorAll(".water-segment").length > 0) {
        nonEmptyIdx = i;
        break;
      }
    }
    expect(nonEmptyIdx).toBeGreaterThanOrEqual(0);

    // Click the non-empty tube to select it
    (tubeEls[nonEmptyIdx] as HTMLElement).click();

    // After re-render, tube should have "selected" class
    const updatedTubes = document.querySelectorAll("#tubes-container .tube");
    expect(updatedTubes[nonEmptyIdx].classList.contains("selected")).toBe(true);

    // Click same tube again to deselect
    (updatedTubes[nonEmptyIdx] as HTMLElement).click();

    // After re-render, no tube should be selected
    const finalTubes = document.querySelectorAll("#tubes-container .tube");
    const selectedTubes = document.querySelectorAll("#tubes-container .tube.selected");
    expect(selectedTubes.length).toBe(0);
    expect(finalTubes.length).toBeGreaterThan(0);
  });

  it("should ignore click on empty tube when nothing is selected", async () => {
    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    const tubeEls = document.querySelectorAll("#tubes-container .tube");

    // Find an empty tube
    let emptyIdx = -1;
    for (let i = 0; i < tubeEls.length; i++) {
      if (tubeEls[i].querySelectorAll(".water-segment").length === 0) {
        emptyIdx = i;
        break;
      }
    }
    expect(emptyIdx).toBeGreaterThanOrEqual(0);

    // Click the empty tube - should be ignored
    (tubeEls[emptyIdx] as HTMLElement).click();

    // No tube should be selected
    const selectedTubes = document.querySelectorAll("#tubes-container .tube.selected");
    expect(selectedTubes.length).toBe(0);
  });

  it("should navigate back to homepage when back button is clicked", async () => {
    await import("../src/main");

    // Start a level
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    const homepage = document.getElementById("homepage")!;
    const gameContainer = document.getElementById("game-container")!;
    expect(gameContainer.classList.contains("hidden")).toBe(false);

    // Click back button
    const backBtn = document.getElementById("back-btn")!;
    backBtn.click();

    // Should be back on homepage
    expect(homepage.classList.contains("hidden")).toBe(false);
    expect(gameContainer.classList.contains("hidden")).toBe(true);
  });

  it("should restart the level when restart button is clicked", async () => {
    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    // Get initial moves display
    const movesDisplay = document.getElementById("moves-display")!;
    expect(movesDisplay.textContent).toBe("Moves: 0");

    // Perform a tube selection (not a pour, just to change state)
    const tubeEls = document.querySelectorAll("#tubes-container .tube");
    let nonEmptyIdx = -1;
    for (let i = 0; i < tubeEls.length; i++) {
      if (tubeEls[i].querySelectorAll(".water-segment").length > 0) {
        nonEmptyIdx = i;
        break;
      }
    }

    if (nonEmptyIdx >= 0) {
      (tubeEls[nonEmptyIdx] as HTMLElement).click();
    }

    // Click restart
    const restartBtn = document.getElementById("restart-btn")!;
    restartBtn.click();

    // Moves should reset to 0
    expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 0");

    // No tube should be selected
    expect(document.querySelectorAll("#tubes-container .tube.selected").length).toBe(0);

    // Win message should be hidden
    expect(document.getElementById("win-message")!.classList.contains("hidden")).toBe(true);
  });

  it("should handle undo button when no history exists", async () => {
    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    // Click undo with no moves made
    const undoBtn = document.getElementById("undo-btn")!;
    undoBtn.click();

    // Should not crash; moves should remain 0
    expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 0");
  });

  it("should show correct level for different level selections", async () => {
    await import("../src/main");

    // Click level 5
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[4] as HTMLElement).click();

    expect(document.getElementById("level-display")!.textContent).toBe("Level: 5");

    // Go back and select level 10
    document.getElementById("back-btn")!.click();

    const newLevelButtons = document.querySelectorAll("#level-grid .level-btn");
    (newLevelButtons[9] as HTMLElement).click();

    expect(document.getElementById("level-display")!.textContent).toBe("Level: 10");
  });

  it("should display different difficulty ratings for different levels", async () => {
    await import("../src/main");

    // Level 1 = Easy
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    const diffDisplay = document.getElementById("difficulty-display")!;
    expect(diffDisplay.textContent).toContain("Easy");

    // Go back, select level 100 = Master
    document.getElementById("back-btn")!.click();

    const newButtons = document.querySelectorAll("#level-grid .level-btn");
    (newButtons[99] as HTMLElement).click();

    expect(document.getElementById("difficulty-display")!.textContent).toContain("Master");
  });

  it("should render correct number of tubes per level config", async () => {
    const { getLevelConfig } = await import("../src/core/difficulty");
    await import("../src/main");

    const levelButtons = document.querySelectorAll("#level-grid .level-btn");

    // Start level 1
    (levelButtons[0] as HTMLElement).click();
    const config1 = getLevelConfig(1);
    const tubes1 = document.querySelectorAll("#tubes-container .tube");
    expect(tubes1.length).toBe(config1.colors + config1.emptyTubes);

    // Go back and start level 50
    document.getElementById("back-btn")!.click();
    const newButtons = document.querySelectorAll("#level-grid .level-btn");
    (newButtons[49] as HTMLElement).click();
    const config50 = getLevelConfig(50);
    const tubes50 = document.querySelectorAll("#tubes-container .tube");
    expect(tubes50.length).toBe(config50.colors + config50.emptyTubes);
  });

  it("should mark completed levels in level grid", async () => {
    // Pre-mark some levels as complete
    localStorage.setItem(
      "waterSortProgress",
      JSON.stringify({ completed: { 1: true, 5: true, 10: true } }),
    );

    await import("../src/main");

    const buttons = document.querySelectorAll("#level-grid .level-btn");
    expect(buttons[0].classList.contains("level-complete")).toBe(true); // Level 1
    expect(buttons[1].classList.contains("level-complete")).toBe(false); // Level 2
    expect(buttons[4].classList.contains("level-complete")).toBe(true); // Level 5
    expect(buttons[9].classList.contains("level-complete")).toBe(true); // Level 10
  });

  it("should show total levels info on homepage", async () => {
    await import("../src/main");

    const info = document.getElementById("total-levels-info")!;
    expect(info.textContent).toContain("100");
    expect(info.textContent).toContain("65,536");
  });
});

describe("Main integration: pour and undo via DOM", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    setupFullDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should perform a pour and increment moves counter", async () => {
    // Mock animatePour to resolve immediately (skip real timers)
    vi.doMock("../src/ui/animations", () => ({
      animatePour: () => Promise.resolve(),
    }));

    const main = await import("../src/main");
    void main; // satisfy no-unused-vars

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    // Get tube elements
    const tubeEls = document.querySelectorAll("#tubes-container .tube");
    expect(tubeEls.length).toBeGreaterThan(2);

    // Find a non-empty tube to select
    let srcIdx = -1;
    for (let i = 0; i < tubeEls.length; i++) {
      if (tubeEls[i].querySelectorAll(".water-segment").length > 0) {
        srcIdx = i;
        break;
      }
    }
    expect(srcIdx).toBeGreaterThanOrEqual(0);

    // Select it
    (tubeEls[srcIdx] as HTMLElement).click();

    // Find an empty tube to pour into
    const updatedTubes = document.querySelectorAll("#tubes-container .tube");
    let dstIdx = -1;
    for (let i = 0; i < updatedTubes.length; i++) {
      if (updatedTubes[i].querySelectorAll(".water-segment").length === 0) {
        dstIdx = i;
        break;
      }
    }

    if (dstIdx >= 0) {
      // Pour to empty tube
      (updatedTubes[dstIdx] as HTMLElement).click();

      // Wait for async animation mock to resolve
      await vi.waitFor(() => {
        const moves = document.getElementById("moves-display")!.textContent;
        expect(moves).toBe("Moves: 1");
      });
    }
  });

  it("should undo a pour and decrement moves counter", async () => {
    // Mock animatePour to resolve immediately
    vi.doMock("../src/ui/animations", () => ({
      animatePour: () => Promise.resolve(),
    }));

    const main = await import("../src/main");
    void main;

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    // Find non-empty tube and empty tube
    const tubeEls = document.querySelectorAll("#tubes-container .tube");
    let srcIdx = -1;
    let dstIdx = -1;
    for (let i = 0; i < tubeEls.length; i++) {
      if (srcIdx === -1 && tubeEls[i].querySelectorAll(".water-segment").length > 0) {
        srcIdx = i;
      }
      if (dstIdx === -1 && tubeEls[i].querySelectorAll(".water-segment").length === 0) {
        dstIdx = i;
      }
    }

    if (srcIdx >= 0 && dstIdx >= 0) {
      // Select and pour
      (tubeEls[srcIdx] as HTMLElement).click();
      const updated = document.querySelectorAll("#tubes-container .tube");
      (updated[dstIdx] as HTMLElement).click();

      // Wait for animation
      await vi.waitFor(() => {
        expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 1");
      });

      // Now undo
      document.getElementById("undo-btn")!.click();

      expect(document.getElementById("moves-display")!.textContent).toBe("Moves: 0");
    }
  });
});

describe("Main integration: shake on invalid pour", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    setupFullDOM();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should apply shake animation on invalid pour attempt", async () => {
    await import("../src/main");

    // Start level 1
    const levelButtons = document.querySelectorAll("#level-grid .level-btn");
    (levelButtons[0] as HTMLElement).click();

    // Get tubes
    const tubeEls = document.querySelectorAll("#tubes-container .tube");

    // Find two non-empty tubes with different top colors
    let srcIdx = -1;
    let dstIdx = -1;
    for (let i = 0; i < tubeEls.length && srcIdx === -1; i++) {
      const segments = tubeEls[i].querySelectorAll(".water-segment");
      if (segments.length > 0 && segments.length < 4) {
        srcIdx = i;
      }
    }

    // Find a full tube (4 segments) to pour into (will be rejected)
    for (let i = 0; i < tubeEls.length && dstIdx === -1; i++) {
      const segments = tubeEls[i].querySelectorAll(".water-segment");
      if (i !== srcIdx && segments.length === 4) {
        dstIdx = i;
      }
    }

    if (srcIdx >= 0 && dstIdx >= 0) {
      // Select source
      (tubeEls[srcIdx] as HTMLElement).click();

      // Try to pour into full tube (invalid)
      const updated = document.querySelectorAll("#tubes-container .tube");
      (updated[dstIdx] as HTMLElement).click();

      // The tube should have "invalid-shake" class
      const shaken = document.querySelectorAll("#tubes-container .tube");
      expect(shaken[dstIdx].classList.contains("invalid-shake")).toBe(true);
    }
  });
});
