/**
 * Comprehensive renderer edge case tests.
 *
 * Tests additional DOM rendering paths and boundary conditions.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  initDOM,
  getElements,
  showHomepage,
  showGameView,
  renderBoard,
  showWinMessage,
  hideWinMessage,
  renderLevelGrid,
  shakeTube,
} from "../src/ui/renderer";

function setupDOM(): void {
  document.body.innerHTML = `
    <div id="homepage">
      <p id="total-levels-info"></p>
      <p id="progress-info"></p>
      <div id="level-grid"></div>
    </div>
    <div id="game-container" class="hidden">
      <div id="tubes-container"></div>
      <span id="level-display"></span>
      <span id="difficulty-display"></span>
      <span id="moves-display"></span>
      <div id="win-message" class="hidden">
        <p id="win-details"></p>
        <button id="next-level-btn"></button>
      </div>
      <button id="undo-btn"></button>
      <button id="restart-btn"></button>
      <button id="back-btn"></button>
    </div>
  `;
}

describe("Renderer: renderBoard comprehensive", () => {
  beforeEach(() => {
    setupDOM();
    initDOM();
    localStorage.clear();
  });

  it("should render board with no selected tube (null)", () => {
    const tubes = [[0, 1], [2, 3]];
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];

    renderBoard(tubes, colors, null, 0, 0, () => {});

    const els = getElements();
    const tubeEls = els.tubesContainer.querySelectorAll(".tube");
    expect(tubeEls.length).toBe(2);
    // No tube should have "selected" class
    tubeEls.forEach((el) => {
      expect(el.classList.contains("selected")).toBe(false);
    });
  });

  it("should apply correct water segment colors for all color indices", () => {
    const tubes = [[0, 1, 2, 3]];
    const colors = ["#aa0000", "#00bb00", "#0000cc", "#dddd00"];

    renderBoard(tubes, colors, null, 0, 0, () => {});

    const els = getElements();
    const segments = els.tubesContainer.querySelectorAll(".water-segment");
    expect(segments.length).toBe(4);
    // Each segment should have a non-empty background color
    segments.forEach((seg) => {
      expect((seg as HTMLElement).style.backgroundColor).toBeTruthy();
    });
  });

  it("should render board with many tubes (20+)", () => {
    const tubes = Array.from({ length: 22 }, (_, i) =>
      i < 20 ? [i % 5, (i + 1) % 5, (i + 2) % 5, (i + 3) % 5] : [],
    );
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];

    renderBoard(tubes, colors, null, 99, 42, () => {});

    const els = getElements();
    const tubeEls = els.tubesContainer.querySelectorAll(".tube");
    expect(tubeEls.length).toBe(22);
    expect(els.levelDisplay.textContent).toBe("Level: 100");
    expect(els.movesDisplay.textContent).toBe("Moves: 42");
  });

  it("should update difficulty display with correct stars", () => {
    renderBoard([[]], [], null, 0, 0, () => {}); // Level 1
    const els = getElements();
    expect(els.diffDisplay.textContent).toContain("★");
    expect(els.diffDisplay.textContent).toContain("Easy");
  });

  it("should update difficulty display for high-difficulty level", () => {
    renderBoard([[]], [], null, 99, 0, () => {}); // Level 100
    const els = getElements();
    expect(els.diffDisplay.textContent).toContain("★");
    // Level 100 should be Master difficulty
    expect(els.diffDisplay.textContent).toContain("Master");
  });

  it("should fire onTubeClick callback with correct index for each tube", () => {
    const tubes = [[0], [1], [2], []];
    const colors = ["#ff0000", "#00ff00", "#0000ff"];
    const clickedIndices: number[] = [];

    renderBoard(tubes, colors, null, 0, 0, (idx) => {
      clickedIndices.push(idx);
    });

    const els = getElements();
    const tubeEls = els.tubesContainer.querySelectorAll(".tube");

    // Click each tube
    (tubeEls[0] as HTMLElement).click();
    (tubeEls[2] as HTMLElement).click();
    (tubeEls[3] as HTMLElement).click();

    expect(clickedIndices).toEqual([0, 2, 3]);
  });

  it("should clear previous tubes before re-rendering", () => {
    const colors = ["#ff0000"];

    // Render first time
    renderBoard([[0]], colors, null, 0, 0, () => {});
    let els = getElements();
    expect(els.tubesContainer.querySelectorAll(".tube").length).toBe(1);

    // Render again with different board
    renderBoard([[0], [0]], colors, null, 0, 0, () => {});
    els = getElements();
    expect(els.tubesContainer.querySelectorAll(".tube").length).toBe(2);
  });

  it("should handle selectedTubeIndex at boundary (first and last tube)", () => {
    const tubes = [[0], [1], [2]];
    const colors = ["#ff0000", "#00ff00", "#0000ff"];

    // Select first
    renderBoard(tubes, colors, 0, 0, 0, () => {});
    let els = getElements();
    let tubeEls = els.tubesContainer.querySelectorAll(".tube");
    expect(tubeEls[0].classList.contains("selected")).toBe(true);
    expect(tubeEls[1].classList.contains("selected")).toBe(false);
    expect(tubeEls[2].classList.contains("selected")).toBe(false);

    // Select last
    renderBoard(tubes, colors, 2, 0, 0, () => {});
    els = getElements();
    tubeEls = els.tubesContainer.querySelectorAll(".tube");
    expect(tubeEls[0].classList.contains("selected")).toBe(false);
    expect(tubeEls[2].classList.contains("selected")).toBe(true);
  });
});

describe("Renderer: renderLevelGrid comprehensive", () => {
  beforeEach(() => {
    setupDOM();
    initDOM();
    localStorage.clear();
  });

  it("should display correct progress with completed levels", () => {
    localStorage.setItem(
      "waterSortProgress",
      JSON.stringify({ completed: { 1: true, 2: true, 3: true, 50: true, 100: true } }),
    );

    renderLevelGrid(() => {});
    const els = getElements();
    expect(els.progressInfo.textContent).toContain("5 / 100");
  });

  it("should show all level numbers in order", () => {
    renderLevelGrid(() => {});
    const els = getElements();
    const levelNums = els.levelGrid.querySelectorAll(".level-num");
    expect(levelNums.length).toBe(100);
    expect(levelNums[0].textContent).toBe("1");
    expect(levelNums[49].textContent).toBe("50");
    expect(levelNums[99].textContent).toBe("100");
  });

  it("should handle clicking multiple level buttons", () => {
    const clicked: number[] = [];
    renderLevelGrid((idx) => clicked.push(idx));

    const els = getElements();
    const buttons = els.levelGrid.querySelectorAll(".level-btn");

    (buttons[0] as HTMLElement).click(); // Level 1 -> index 0
    (buttons[49] as HTMLElement).click(); // Level 50 -> index 49
    (buttons[99] as HTMLElement).click(); // Level 100 -> index 99

    expect(clicked).toEqual([0, 49, 99]);
  });

  it("should have appropriate star ratings that increase", () => {
    renderLevelGrid(() => {});
    const els = getElements();
    const starSpans = els.levelGrid.querySelectorAll(".level-stars");

    // Level 1 = 1 star (★), Level 100 = 5 stars (★★★★★)
    expect(starSpans[0].textContent).toBe("★");
    expect(starSpans[99].textContent).toBe("★★★★★");
  });

  it("should show correct difficulty label for last level", () => {
    renderLevelGrid(() => {});
    const els = getElements();
    const labels = els.levelGrid.querySelectorAll(".level-label");
    expect(labels[99].textContent).toBe("Master");
  });
});

describe("Renderer: showWinMessage edge cases", () => {
  beforeEach(() => {
    setupDOM();
    initDOM();
  });

  it("should handle 0 moves", () => {
    showWinMessage(0, false);
    const els = getElements();
    expect(els.winDetails.textContent).toContain("0 moves");
  });

  it("should handle very large move count", () => {
    showWinMessage(9999, false);
    const els = getElements();
    expect(els.winDetails.textContent).toContain("9999 moves");
  });

  it("should toggle between next level and back to levels", () => {
    const els = getElements();

    showWinMessage(5, false);
    expect(els.nextLevelBtn.textContent).toBe("Next Level");

    showWinMessage(5, true);
    expect(els.nextLevelBtn.textContent).toBe("Back to Levels");

    showWinMessage(5, false);
    expect(els.nextLevelBtn.textContent).toBe("Next Level");
  });

  it("should show/hide win message correctly", () => {
    const els = getElements();

    expect(els.winMessage.classList.contains("hidden")).toBe(true);

    showWinMessage(5, false);
    expect(els.winMessage.classList.contains("hidden")).toBe(false);

    hideWinMessage();
    expect(els.winMessage.classList.contains("hidden")).toBe(true);

    // Show again
    showWinMessage(10, true);
    expect(els.winMessage.classList.contains("hidden")).toBe(false);
  });
});

describe("Renderer: shakeTube comprehensive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupDOM();
    initDOM();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should add shake class immediately", () => {
    renderBoard([[0], [1]], ["#ff0000", "#00ff00"], null, 0, 0, () => {});

    shakeTube(0);
    const els = getElements();
    const tubeEls = els.tubesContainer.querySelectorAll(".tube");
    expect(tubeEls[0].classList.contains("invalid-shake")).toBe(true);
  });

  it("should remove shake class after 400ms", () => {
    renderBoard([[0], [1]], ["#ff0000", "#00ff00"], null, 0, 0, () => {});

    shakeTube(0);
    const els = getElements();
    const tubeEls = els.tubesContainer.querySelectorAll(".tube");

    vi.advanceTimersByTime(399);
    expect(tubeEls[0].classList.contains("invalid-shake")).toBe(true);

    vi.advanceTimersByTime(1);
    expect(tubeEls[0].classList.contains("invalid-shake")).toBe(false);
  });

  it("should handle shaking last tube", () => {
    renderBoard([[0], [1], []], ["#ff0000", "#00ff00"], null, 0, 0, () => {});

    shakeTube(2);
    const els = getElements();
    const tubeEls = els.tubesContainer.querySelectorAll(".tube");
    expect(tubeEls[2].classList.contains("invalid-shake")).toBe(true);

    vi.advanceTimersByTime(400);
    expect(tubeEls[2].classList.contains("invalid-shake")).toBe(false);
  });

  it("should handle shaking when no tubes exist", () => {
    renderBoard([], [], null, 0, 0, () => {});
    // Should not throw
    expect(() => shakeTube(0)).not.toThrow();
  });
});

describe("Renderer: view toggle comprehensive", () => {
  beforeEach(() => {
    setupDOM();
    initDOM();
  });

  it("should start with homepage visible (no hidden class)", () => {
    const els = getElements();
    expect(els.homepage.classList.contains("hidden")).toBe(false);
  });

  it("should start with game container hidden", () => {
    const els = getElements();
    expect(els.gameContainer.classList.contains("hidden")).toBe(true);
  });

  it("should handle rapid view toggles", () => {
    const els = getElements();

    showGameView();
    showHomepage();
    showGameView();
    showHomepage();
    showGameView();

    expect(els.homepage.classList.contains("hidden")).toBe(true);
    expect(els.gameContainer.classList.contains("hidden")).toBe(false);
  });
});
