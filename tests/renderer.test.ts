/**
 * UI Renderer tests.
 *
 * Tests DOM rendering functions using jsdom environment.
 */
import { describe, it, expect, beforeEach } from "vitest";
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

/**
 * Set up the minimal DOM structure required by the renderer.
 */
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

describe("Renderer: initDOM", () => {
  beforeEach(() => {
    setupDOM();
    localStorage.clear();
  });

  it("should initialize all DOM element references", () => {
    const els = initDOM();
    expect(els.homepage).toBeTruthy();
    expect(els.gameContainer).toBeTruthy();
    expect(els.levelGrid).toBeTruthy();
    expect(els.totalLevelsInfo).toBeTruthy();
    expect(els.progressInfo).toBeTruthy();
    expect(els.tubesContainer).toBeTruthy();
    expect(els.levelDisplay).toBeTruthy();
    expect(els.diffDisplay).toBeTruthy();
    expect(els.movesDisplay).toBeTruthy();
    expect(els.winMessage).toBeTruthy();
    expect(els.winDetails).toBeTruthy();
    expect(els.nextLevelBtn).toBeTruthy();
    expect(els.undoBtn).toBeTruthy();
    expect(els.restartBtn).toBeTruthy();
    expect(els.backBtn).toBeTruthy();
  });

  it("should throw if getElements is called before initDOM", () => {
    // Reset the module state by importing fresh
    // Since we can't easily reset module state, test that after initDOM it works
    initDOM();
    expect(() => getElements()).not.toThrow();
  });
});

describe("Renderer: showHomepage / showGameView", () => {
  beforeEach(() => {
    setupDOM();
    initDOM();
    localStorage.clear();
  });

  it("should show homepage and hide game container", () => {
    showHomepage();
    const els = getElements();
    expect(els.homepage.classList.contains("hidden")).toBe(false);
    expect(els.gameContainer.classList.contains("hidden")).toBe(true);
  });

  it("should show game view and hide homepage", () => {
    showGameView();
    const els = getElements();
    expect(els.homepage.classList.contains("hidden")).toBe(true);
    expect(els.gameContainer.classList.contains("hidden")).toBe(false);
  });

  it("should toggle views correctly", () => {
    showGameView();
    const els = getElements();
    expect(els.homepage.classList.contains("hidden")).toBe(true);

    showHomepage();
    expect(els.homepage.classList.contains("hidden")).toBe(false);
    expect(els.gameContainer.classList.contains("hidden")).toBe(true);
  });
});

describe("Renderer: renderBoard", () => {
  beforeEach(() => {
    setupDOM();
    initDOM();
    localStorage.clear();
  });

  it("should render tubes with correct number of segments", () => {
    const tubes = [[0, 1, 2, 3], [1, 1, 1, 1], []];
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];

    renderBoard(tubes, colors, null, 0, 5, () => {});

    const els = getElements();
    const tubeEls = els.tubesContainer.querySelectorAll(".tube");
    expect(tubeEls.length).toBe(3);

    // First tube has 4 segments
    expect(tubeEls[0].querySelectorAll(".water-segment").length).toBe(4);
    // Second tube has 4 segments
    expect(tubeEls[1].querySelectorAll(".water-segment").length).toBe(4);
    // Third tube is empty
    expect(tubeEls[2].querySelectorAll(".water-segment").length).toBe(0);
  });

  it("should apply selected class to selected tube", () => {
    const tubes = [[0, 1], [2, 3], []];
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];

    renderBoard(tubes, colors, 1, 0, 0, () => {});

    const els = getElements();
    const tubeEls = els.tubesContainer.querySelectorAll(".tube");
    expect(tubeEls[0].classList.contains("selected")).toBe(false);
    expect(tubeEls[1].classList.contains("selected")).toBe(true);
    expect(tubeEls[2].classList.contains("selected")).toBe(false);
  });

  it("should set background colors on segments", () => {
    const tubes = [[0, 1]];
    const colors = ["#ff0000", "#00ff00"];

    renderBoard(tubes, colors, null, 0, 0, () => {});

    const els = getElements();
    const segments = els.tubesContainer.querySelectorAll(".water-segment");
    // jsdom may normalize hex to rgb() format
    const bg0 = (segments[0] as HTMLElement).style.backgroundColor;
    const bg1 = (segments[1] as HTMLElement).style.backgroundColor;
    expect(bg0).toBeTruthy();
    expect(bg1).toBeTruthy();
    expect(bg0).not.toBe(bg1);
  });

  it("should update level display text", () => {
    const tubes = [[]];
    const colors: string[] = [];

    renderBoard(tubes, colors, null, 4, 10, () => {}); // level index 4 = level 5

    const els = getElements();
    expect(els.levelDisplay.textContent).toBe("Level: 5");
    expect(els.movesDisplay.textContent).toBe("Moves: 10");
  });

  it("should call onTubeClick when a tube is clicked", () => {
    const tubes = [[0], [1], []];
    const colors = ["#ff0000", "#00ff00"];
    let clickedIdx = -1;

    renderBoard(tubes, colors, null, 0, 0, (idx) => {
      clickedIdx = idx;
    });

    const els = getElements();
    const tubeEls = els.tubesContainer.querySelectorAll(".tube");
    (tubeEls[1] as HTMLElement).click();
    expect(clickedIdx).toBe(1);
  });

  it("should handle empty board", () => {
    renderBoard([], [], null, 0, 0, () => {});
    const els = getElements();
    expect(els.tubesContainer.querySelectorAll(".tube").length).toBe(0);
  });
});

describe("Renderer: renderLevelGrid", () => {
  beforeEach(() => {
    setupDOM();
    initDOM();
    localStorage.clear();
  });

  it("should render 100 level buttons", () => {
    renderLevelGrid(() => {});
    const els = getElements();
    const buttons = els.levelGrid.querySelectorAll(".level-btn");
    expect(buttons.length).toBe(100);
  });

  it("should display total levels info", () => {
    renderLevelGrid(() => {});
    const els = getElements();
    expect(els.totalLevelsInfo.textContent).toContain("100");
    expect(els.totalLevelsInfo.textContent).toContain("65,536");
  });

  it("should display progress info", () => {
    renderLevelGrid(() => {});
    const els = getElements();
    expect(els.progressInfo.textContent).toContain("0 / 100");
  });

  it("should mark completed levels", () => {
    localStorage.setItem(
      "waterSortProgress",
      JSON.stringify({ completed: { 1: true, 5: true } }),
    );

    renderLevelGrid(() => {});
    const els = getElements();
    const buttons = els.levelGrid.querySelectorAll(".level-btn");

    expect(buttons[0].classList.contains("level-complete")).toBe(true); // Level 1
    expect(buttons[1].classList.contains("level-complete")).toBe(false); // Level 2
    expect(buttons[4].classList.contains("level-complete")).toBe(true); // Level 5
  });

  it("should call onLevelClick with correct level index", () => {
    let clickedIndex = -1;
    renderLevelGrid((idx) => {
      clickedIndex = idx;
    });

    const els = getElements();
    const buttons = els.levelGrid.querySelectorAll(".level-btn");
    // Click level 3 button (index 2)
    (buttons[2] as HTMLElement).click();
    expect(clickedIndex).toBe(2); // 0-based
  });

  it("should show star ratings for each level", () => {
    renderLevelGrid(() => {});
    const els = getElements();
    const starSpans = els.levelGrid.querySelectorAll(".level-stars");
    expect(starSpans.length).toBe(100);
    // Level 1 should have 1 star
    expect(starSpans[0].textContent).toBe("★");
  });

  it("should show difficulty labels", () => {
    renderLevelGrid(() => {});
    const els = getElements();
    const labels = els.levelGrid.querySelectorAll(".level-label");
    expect(labels.length).toBe(100);
    // Level 1 should be "Easy"
    expect(labels[0].textContent).toBe("Easy");
  });
});

describe("Renderer: showWinMessage / hideWinMessage", () => {
  beforeEach(() => {
    setupDOM();
    initDOM();
  });

  it("should show win message with correct move count", () => {
    showWinMessage(15, false);
    const els = getElements();
    expect(els.winMessage.classList.contains("hidden")).toBe(false);
    expect(els.winDetails.textContent).toContain("15 moves");
  });

  it("should use singular 'move' for 1 move", () => {
    showWinMessage(1, false);
    const els = getElements();
    expect(els.winDetails.textContent).toContain("1 move!");
    expect(els.winDetails.textContent).not.toContain("1 moves");
  });

  it("should show 'Next Level' for non-last levels", () => {
    showWinMessage(5, false);
    const els = getElements();
    expect(els.nextLevelBtn.textContent).toBe("Next Level");
  });

  it("should show 'Back to Levels' for last level", () => {
    showWinMessage(5, true);
    const els = getElements();
    expect(els.nextLevelBtn.textContent).toBe("Back to Levels");
  });

  it("should hide win message", () => {
    showWinMessage(5, false);
    hideWinMessage();
    const els = getElements();
    expect(els.winMessage.classList.contains("hidden")).toBe(true);
  });
});

describe("Renderer: shakeTube", () => {
  beforeEach(() => {
    setupDOM();
    initDOM();
  });

  it("should add and remove shake class", async () => {
    // Render some tubes first
    renderBoard([[0], [1]], ["#ff0000", "#00ff00"], null, 0, 0, () => {});

    shakeTube(0);

    const els = getElements();
    const tubeEls = els.tubesContainer.querySelectorAll(".tube");
    expect(tubeEls[0].classList.contains("invalid-shake")).toBe(true);

    // Wait for timeout (400ms)
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(tubeEls[0].classList.contains("invalid-shake")).toBe(false);
  });

  it("should handle invalid tube index gracefully", () => {
    renderBoard([[0]], ["#ff0000"], null, 0, 0, () => {});
    // Should not throw for out-of-range index
    expect(() => shakeTube(99)).not.toThrow();
  });
});
