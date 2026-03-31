/**
 * DOM rendering module.
 *
 * Handles all DOM updates for the game UI.
 */

import { type GameBoard, TOTAL_LEVELS, MAX_LEVELS } from "../core/types";
import { getDifficultyStars, getDifficultyLabel } from "../core/difficulty";
import { loadProgress, getCompletedCount } from "../core/storage";

/** DOM element references (cached on init). */
interface DOMElements {
  homepage: HTMLElement;
  gameContainer: HTMLElement;
  levelGrid: HTMLElement;
  totalLevelsInfo: HTMLElement;
  progressInfo: HTMLElement;
  tubesContainer: HTMLElement;
  levelDisplay: HTMLElement;
  diffDisplay: HTMLElement;
  movesDisplay: HTMLElement;
  winMessage: HTMLElement;
  winDetails: HTMLElement;
  nextLevelBtn: HTMLElement;
  undoBtn: HTMLElement;
  restartBtn: HTMLElement;
  backBtn: HTMLElement;
}

let elements: DOMElements | null = null;

/**
 * Initialize DOM element references. Must be called after DOM is ready.
 */
export function initDOM(): DOMElements {
  elements = {
    homepage: document.getElementById("homepage")!,
    gameContainer: document.getElementById("game-container")!,
    levelGrid: document.getElementById("level-grid")!,
    totalLevelsInfo: document.getElementById("total-levels-info")!,
    progressInfo: document.getElementById("progress-info")!,
    tubesContainer: document.getElementById("tubes-container")!,
    levelDisplay: document.getElementById("level-display")!,
    diffDisplay: document.getElementById("difficulty-display")!,
    movesDisplay: document.getElementById("moves-display")!,
    winMessage: document.getElementById("win-message")!,
    winDetails: document.getElementById("win-details")!,
    nextLevelBtn: document.getElementById("next-level-btn")!,
    undoBtn: document.getElementById("undo-btn")!,
    restartBtn: document.getElementById("restart-btn")!,
    backBtn: document.getElementById("back-btn")!,
  };
  return elements;
}

/**
 * Get cached DOM elements.
 */
export function getElements(): DOMElements {
  if (!elements) throw new Error("DOM not initialized. Call initDOM() first.");
  return elements;
}

/**
 * Show the homepage and hide the game view.
 */
export function showHomepage(): void {
  const els = getElements();
  els.homepage.classList.remove("hidden");
  els.gameContainer.classList.add("hidden");
}

/**
 * Show the game view and hide the homepage.
 */
export function showGameView(): void {
  const els = getElements();
  els.homepage.classList.add("hidden");
  els.gameContainer.classList.remove("hidden");
}

/**
 * Render the level selection grid on the homepage.
 *
 * @param onLevelClick - Callback when a level button is clicked (receives 0-based level index)
 */
export function renderLevelGrid(onLevelClick: (levelIndex: number) => void): void {
  const els = getElements();
  els.levelGrid.innerHTML = "";
  const progress = loadProgress();
  const completed = getCompletedCount();

  els.totalLevelsInfo.textContent =
    "Total Levels: " + TOTAL_LEVELS + " (expandable to " + MAX_LEVELS.toLocaleString() + ")";
  els.progressInfo.textContent = "Completed: " + completed + " / " + TOTAL_LEVELS;

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const levelNum = i;
    const btn = document.createElement("button");
    btn.className = "level-btn";
    const stars = getDifficultyStars(levelNum);
    const label = getDifficultyLabel(stars);
    const isComplete = progress.completed[levelNum];

    if (isComplete) btn.classList.add("level-complete");

    btn.innerHTML =
      '<span class="level-num">' +
      levelNum +
      "</span>" +
      '<span class="level-stars">' +
      "★".repeat(stars) +
      "</span>" +
      '<span class="level-label">' +
      label +
      "</span>";

    btn.addEventListener("click", () => {
      onLevelClick(levelNum - 1);
    });
    els.levelGrid.appendChild(btn);
  }
}

/**
 * Render the game board (tubes with water segments).
 *
 * @param tubes - Current game board
 * @param levelColors - Color palette for current level
 * @param selectedTubeIndex - Currently selected tube index (or null)
 * @param currentLevel - 0-based level index
 * @param moves - Current move count
 * @param onTubeClick - Callback when a tube is clicked (receives tube index)
 */
export function renderBoard(
  tubes: GameBoard,
  levelColors: string[],
  selectedTubeIndex: number | null,
  currentLevel: number,
  moves: number,
  onTubeClick: (idx: number) => void,
): void {
  const els = getElements();
  els.tubesContainer.innerHTML = "";

  tubes.forEach((tube, idx) => {
    const el = document.createElement("div");
    el.className = "tube";
    if (idx === selectedTubeIndex) el.classList.add("selected");

    tube.forEach((colorIdx) => {
      const seg = document.createElement("div");
      seg.className = "water-segment";
      seg.style.backgroundColor = levelColors[colorIdx];
      el.appendChild(seg);
    });

    el.addEventListener("click", () => onTubeClick(idx));
    els.tubesContainer.appendChild(el);
  });

  const levelNum = currentLevel + 1;
  const stars = getDifficultyStars(levelNum);
  els.levelDisplay.textContent = "Level: " + levelNum;
  els.diffDisplay.textContent = "Difficulty: " + "★".repeat(stars) + " " + getDifficultyLabel(stars);
  els.movesDisplay.textContent = "Moves: " + moves;
}

/**
 * Show the win message overlay.
 *
 * @param moves - Number of moves to complete the level
 * @param isLastLevel - Whether this was the final level
 */
export function showWinMessage(moves: number, isLastLevel: boolean): void {
  const els = getElements();
  els.winDetails.textContent = "Completed in " + moves + " move" + (moves !== 1 ? "s" : "") + "!";
  els.winMessage.classList.remove("hidden");

  if (isLastLevel) {
    els.nextLevelBtn.textContent = "Back to Levels";
  } else {
    els.nextLevelBtn.textContent = "Next Level";
  }
}

/**
 * Hide the win message overlay.
 */
export function hideWinMessage(): void {
  const els = getElements();
  els.winMessage.classList.add("hidden");
}

/**
 * Apply shake animation to a tube element.
 *
 * @param tubeIndex - Index of the tube to shake
 */
export function shakeTube(tubeIndex: number): void {
  const els = getElements();
  const tubeEls = els.tubesContainer.querySelectorAll(".tube");
  const tubeEl = tubeEls[tubeIndex];
  if (tubeEl) {
    tubeEl.classList.add("invalid-shake");
    setTimeout(() => {
      tubeEl.classList.remove("invalid-shake");
    }, 400);
  }
}
