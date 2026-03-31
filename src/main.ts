/**
 * GWaterSort – Main application entry point.
 *
 * Orchestrates game state, user interactions, and rendering.
 */

import "./style.css";
import { type GameBoard, TOTAL_LEVELS } from "./core/types";
import { cloneTubes, canPour, pour, checkWin, topColor, topRunLength } from "./core/engine";
import { generateLevel } from "./core/level-generator";
import { markLevelComplete } from "./core/storage";
import {
  initDOM,
  getElements,
  showHomepage,
  showGameView,
  renderLevelGrid,
  renderBoard,
  showWinMessage,
  hideWinMessage,
  shakeTube,
} from "./ui/renderer";
import { animatePour } from "./ui/animations";

/* ══════════════════════════════════════════════
   Game State
══════════════════════════════════════════════ */
let currentLevel = 0;
let tubes: GameBoard = [];
let levelColors: string[] = [];
let selectedTubeIndex: number | null = null;
let moves = 0;
let history: GameBoard[] = [];
let isAnimating = false;

/* ══════════════════════════════════════════════
   Core Game Functions
══════════════════════════════════════════════ */
function render(): void {
  renderBoard(tubes, levelColors, selectedTubeIndex, currentLevel, moves, onTubeClick);
}

function onTubeClick(idx: number): void {
  if (isAnimating) return;

  if (selectedTubeIndex === null) {
    if (tubes[idx].length === 0) return;
    selectedTubeIndex = idx;
    render();
    return;
  }

  if (selectedTubeIndex === idx) {
    selectedTubeIndex = null;
    render();
    return;
  }

  if (canPour(tubes, selectedTubeIndex, idx)) {
    const srcIdx = selectedTubeIndex;
    const colorIdx = topColor(tubes[srcIdx])!;
    const run = topRunLength(tubes[srcIdx]);
    const space = 4 - tubes[idx].length;
    const amount = Math.min(run, space);

    history.push(cloneTubes(tubes));
    selectedTubeIndex = null;

    // Perform the pour (data)
    pour(tubes, srcIdx, idx);
    moves++;

    // Animate
    isAnimating = true;
    render();

    const els = getElements();
    animatePour(
      els.tubesContainer,
      srcIdx,
      idx,
      levelColors[colorIdx],
      amount,
      tubes[idx].length,
    ).then(() => {
      isAnimating = false;
      render();
      if (checkWin(tubes)) {
        onWin();
      }
    });
  } else {
    selectedTubeIndex = null;
    render();
    shakeTube(idx);
  }
}

function onWin(): void {
  const levelNum = currentLevel + 1;
  markLevelComplete(levelNum);
  showWinMessage(moves, currentLevel >= TOTAL_LEVELS - 1);
}

function startLevel(levelIndex: number): void {
  currentLevel = levelIndex;
  const result = generateLevel(levelIndex);
  tubes = result.board;
  levelColors = result.colors;
  selectedTubeIndex = null;
  moves = 0;
  history = [];
  isAnimating = false;
  hideWinMessage();
  showGameView();
  render();
}

function goToHomepage(): void {
  showHomepage();
  renderLevelGrid((levelIndex) => startLevel(levelIndex));
}

/* ══════════════════════════════════════════════
   Initialize
══════════════════════════════════════════════ */
initDOM();

const els = getElements();

els.nextLevelBtn.addEventListener("click", () => {
  if (currentLevel >= TOTAL_LEVELS - 1) {
    goToHomepage();
  } else {
    startLevel(currentLevel + 1);
  }
});

els.restartBtn.addEventListener("click", () => {
  startLevel(currentLevel);
});

els.undoBtn.addEventListener("click", () => {
  if (isAnimating) return;
  if (history.length === 0) return;
  tubes = history.pop()!;
  moves = Math.max(0, moves - 1);
  selectedTubeIndex = null;
  render();
});

els.backBtn.addEventListener("click", () => {
  goToHomepage();
});

// Start on the homepage
goToHomepage();
