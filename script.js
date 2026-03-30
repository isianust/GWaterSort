(function () {
  "use strict";

  /* ══════════════════════════════════════════════
     Constants
  ══════════════════════════════════════════════ */
  var TUBE_CAPACITY = 4;
  var TOTAL_LEVELS = 100;    // Fixed 100 levels; expandable up to 65536
  var MAX_LEVELS = 65536;
  var STORAGE_KEY = "waterSortProgress";

  /* Color generation tuning */
  var COLOR_SAT_MIN = 55;
  var COLOR_SAT_RANGE = 40;    // saturation: 55–95%
  var COLOR_LIT_MIN = 35;
  var COLOR_LIT_RANGE = 30;    // lightness: 35–65%

  /* Difficulty tuning */
  var DIFFICULTY_COLOR_DIVISOR = 8;
  var MAX_COLORS = 20;
  var HIGH_DIFFICULTY_THRESHOLD = 60;

  /* Animation constants (pixels & milliseconds) */
  var SEGMENT_HEIGHT_PX = 38;
  var RISE_OFFSET_PX = 50;
  var DROP_HOVER_OFFSET_PX = 30;
  var INITIAL_DROP_OFFSET_PX = 10;
  var DROP_HALF_WIDTH_PX = 20;
  var DROP_WIDTH_PX = 40;
  var RISE_DURATION_MS = 250;
  var MOVE_DURATION_MS = 400;
  var DROP_DURATION_MS = 300;
  var ANIMATION_EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

  /* Shuffle */
  var MAX_SHUFFLE_ATTEMPTS = 200;

  /* ══════════════════════════════════════════════
     Random Color Generation (full 16M RGB space)
     Generates visually distinct colors using
     golden-angle spacing in HSL then converting to hex.
  ══════════════════════════════════════════════ */
  function hslToHex(h, s, l) {
    h = h % 360;
    s = s / 100;
    l = l / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Seeded pseudo-random number generator (mulberry32).
   * Ensures the same level always produces the same colors.
   */
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Generate `count` visually distinct random colors for a given level.
   * Uses golden-angle hue spacing with random saturation/lightness offsets.
   */
  function generateColors(count, levelIndex) {
    var rng = mulberry32(levelIndex * 7919 + 31);
    var colors = [];
    var goldenAngle = 137.508;
    var baseHue = rng() * 360;
    for (var i = 0; i < count; i++) {
      var hue = (baseHue + i * goldenAngle + rng() * 15) % 360;
      var sat = COLOR_SAT_MIN + rng() * COLOR_SAT_RANGE;
      var lit = COLOR_LIT_MIN + rng() * COLOR_LIT_RANGE;
      colors.push(hslToHex(hue, sat, lit));
    }
    return colors;
  }

  /* ══════════════════════════════════════════════
     Difficulty System
     Every 5 levels:  difficulty += levelNum / 5
     Every 10 levels: difficulty += levelNum / 10
     This affects: number of colors, empty tubes, shuffle intensity.
  ══════════════════════════════════════════════ */
  function getDifficulty(levelNum) {
    // levelNum is 1-based
    var base = levelNum;
    var bonus5  = (levelNum % 5 === 0)  ? Math.floor(levelNum / 5)  : 0;
    var bonus10 = (levelNum % 10 === 0) ? Math.floor(levelNum / 10) : 0;
    return base + bonus5 + bonus10;
  }

  function getDifficultyStars(levelNum) {
    var d = getDifficulty(levelNum);
    if (d <= 10)  return 1;
    if (d <= 25)  return 2;
    if (d <= 50)  return 3;
    if (d <= 80)  return 4;
    return 5;
  }

  function getDifficultyLabel(stars) {
    var labels = ["", "Easy", "Normal", "Hard", "Expert", "Master"];
    return labels[stars] || "Master";
  }

  /**
   * Generate level configuration based on level number (1-based).
   */
  function getLevelConfig(levelNum) {
    var diff = getDifficulty(levelNum);
    // Colors: start at 2, ramp up based on difficulty
    var numColors = Math.min(2 + Math.floor(diff / DIFFICULTY_COLOR_DIVISOR), MAX_COLORS);
    if (numColors < 2) numColors = 2;
    // Empty tubes: start at 2, reduce at higher difficulties
    var emptyTubes = diff > HIGH_DIFFICULTY_THRESHOLD ? 1 : 2;
    return { colors: numColors, emptyTubes: emptyTubes };
  }

  /* ══════════════════════════════════════════════
     Progress persistence (localStorage)
  ══════════════════════════════════════════════ */
  function loadProgress() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) { /* ignore */ }
    return { completed: {} };
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) { /* ignore */ }
  }

  function markLevelComplete(levelNum) {
    var progress = loadProgress();
    progress.completed[levelNum] = true;
    saveProgress(progress);
  }

  function getCompletedCount() {
    var progress = loadProgress();
    return Object.keys(progress.completed).length;
  }

  /* ══════════════════════════════════════════════
     Game state
  ══════════════════════════════════════════════ */
  var currentLevel = 0;       // 0-based index
  var tubes = [];
  var levelColors = [];       // Hex colors for the current level
  var selectedTubeIndex = null;
  var moves = 0;
  var history = [];
  var isAnimating = false;    // Lock during pour animation

  /* ══════════════════════════════════════════════
     DOM references
  ══════════════════════════════════════════════ */
  var homepage       = document.getElementById("homepage");
  var gameContainer  = document.getElementById("game-container");
  var levelGrid      = document.getElementById("level-grid");
  var totalLevelsInfo = document.getElementById("total-levels-info");
  var progressInfo   = document.getElementById("progress-info");
  var tubesContainer = document.getElementById("tubes-container");
  var levelDisplay   = document.getElementById("level-display");
  var diffDisplay    = document.getElementById("difficulty-display");
  var movesDisplay   = document.getElementById("moves-display");
  var winMessage     = document.getElementById("win-message");
  var winDetails     = document.getElementById("win-details");
  var nextLevelBtn   = document.getElementById("next-level-btn");
  var undoBtn        = document.getElementById("undo-btn");
  var restartBtn     = document.getElementById("restart-btn");
  var backBtn        = document.getElementById("back-btn");

  /* ══════════════════════════════════════════════
     Utilities
  ══════════════════════════════════════════════ */
  function cloneTubes(src) {
    return src.map(function (t) { return t.slice(); });
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function isTubeSolved(tube) {
    return tube.length === TUBE_CAPACITY &&
           tube.every(function (c) { return c === tube[0]; });
  }

  function topColor(tube) {
    return tube.length > 0 ? tube[tube.length - 1] : null;
  }

  function topRunLength(tube) {
    if (tube.length === 0) return 0;
    var color = topColor(tube);
    var count = 0;
    for (var i = tube.length - 1; i >= 0; i--) {
      if (tube[i] === color) count++;
      else break;
    }
    return count;
  }

  /* ══════════════════════════════════════════════
     Homepage / Level Selection
  ══════════════════════════════════════════════ */
  function showHomepage() {
    homepage.classList.remove("hidden");
    gameContainer.classList.add("hidden");
    renderLevelGrid();
  }

  function renderLevelGrid() {
    levelGrid.innerHTML = "";
    var progress = loadProgress();
    var completed = getCompletedCount();

    totalLevelsInfo.textContent = "Total Levels: " + TOTAL_LEVELS + " (expandable to " + MAX_LEVELS.toLocaleString() + ")";
    progressInfo.textContent = "Completed: " + completed + " / " + TOTAL_LEVELS;

    for (var i = 1; i <= TOTAL_LEVELS; i++) {
      (function (levelNum) {
        var btn = document.createElement("button");
        btn.className = "level-btn";
        var stars = getDifficultyStars(levelNum);
        var label = getDifficultyLabel(stars);
        var isComplete = progress.completed[levelNum];

        if (isComplete) btn.classList.add("level-complete");

        btn.innerHTML =
          '<span class="level-num">' + levelNum + '</span>' +
          '<span class="level-stars">' + "★".repeat(stars) + '</span>' +
          '<span class="level-label">' + label + '</span>';

        btn.addEventListener("click", function () {
          startLevel(levelNum - 1);
        });
        levelGrid.appendChild(btn);
      })(i);
    }
  }

  /* ══════════════════════════════════════════════
     Level generation
  ══════════════════════════════════════════════ */
  function generateLevel(levelIndex) {
    var levelNum = levelIndex + 1;
    var config = getLevelConfig(levelNum);
    var numColors  = config.colors;
    var emptyTubes = config.emptyTubes;

    // Generate random colors for this level
    levelColors = generateColors(numColors, levelIndex);

    // Build flat array with TUBE_CAPACITY copies of each color index
    var segments = [];
    for (var c = 0; c < numColors; c++) {
      for (var s = 0; s < TUBE_CAPACITY; s++) {
        segments.push(c);
      }
    }

    // Shuffle until the puzzle is not trivially solved
    var attempts = 0;
    do {
      shuffle(segments);
      attempts++;
    } while (isPuzzleTrivial(segments, numColors) && attempts < MAX_SHUFFLE_ATTEMPTS);

    if (isPuzzleTrivial(segments, numColors) && segments.length >= 2) {
      var tmp = segments[0];
      segments[0] = segments[segments.length - 1];
      segments[segments.length - 1] = tmp;
    }

    // Distribute into tubes (store color indices)
    var result = [];
    for (var t = 0; t < numColors; t++) {
      result.push(segments.slice(t * TUBE_CAPACITY, (t + 1) * TUBE_CAPACITY));
    }
    for (var e = 0; e < emptyTubes; e++) {
      result.push([]);
    }
    return result;
  }

  function isPuzzleTrivial(segments, numColors) {
    for (var t = 0; t < numColors; t++) {
      var slice = segments.slice(t * TUBE_CAPACITY, (t + 1) * TUBE_CAPACITY);
      var allSame = slice.every(function (c) { return c === slice[0]; });
      if (!allSame) return false;
    }
    return true;
  }

  /* ══════════════════════════════════════════════
     Rendering
  ══════════════════════════════════════════════ */
  function render() {
    tubesContainer.innerHTML = "";

    tubes.forEach(function (tube, idx) {
      var el = document.createElement("div");
      el.className = "tube";
      if (idx === selectedTubeIndex) el.classList.add("selected");

      // Water segments (rendered bottom → top via column-reverse)
      tube.forEach(function (colorIdx) {
        var seg = document.createElement("div");
        seg.className = "water-segment";
        seg.style.backgroundColor = levelColors[colorIdx];
        el.appendChild(seg);
      });

      el.addEventListener("click", function () { onTubeClick(idx); });
      tubesContainer.appendChild(el);
    });

    var levelNum = currentLevel + 1;
    var stars = getDifficultyStars(levelNum);
    levelDisplay.textContent = "Level: " + levelNum;
    diffDisplay.textContent = "Difficulty: " + "★".repeat(stars) + " " + getDifficultyLabel(stars);
    movesDisplay.textContent = "Moves: " + moves;
  }

  /* ══════════════════════════════════════════════
     Pour Animation
  ══════════════════════════════════════════════ */

  /**
   * Animate pouring water from srcIdx to dstIdx.
   * Returns a Promise that resolves when the animation finishes.
   */
  function animatePour(srcIdx, dstIdx, colorIdx, amount) {
    return new Promise(function (resolve) {
      var tubeEls = tubesContainer.querySelectorAll(".tube");
      var srcEl = tubeEls[srcIdx];
      var dstEl = tubeEls[dstIdx];

      if (!srcEl || !dstEl) { resolve(); return; }

      var srcRect = srcEl.getBoundingClientRect();
      var dstRect = dstEl.getBoundingClientRect();

      // Create the animated water drop
      var drop = document.createElement("div");
      drop.className = "water-drop";
      drop.style.backgroundColor = levelColors[colorIdx];
      drop.style.width = DROP_WIDTH_PX + "px";
      drop.style.height = (amount * SEGMENT_HEIGHT_PX) + "px";

      // Position at the top of source tube
      drop.style.position = "fixed";
      drop.style.left = (srcRect.left + srcRect.width / 2 - DROP_HALF_WIDTH_PX) + "px";
      drop.style.top = (srcRect.top - INITIAL_DROP_OFFSET_PX) + "px";
      drop.style.zIndex = "1000";
      drop.style.borderRadius = "8px";
      drop.style.opacity = "0.9";
      drop.style.transition = "all " + (MOVE_DURATION_MS / 1000) + "s " + ANIMATION_EASING;
      document.body.appendChild(drop);

      // Phase 1: Rise up from source
      requestAnimationFrame(function () {
        drop.style.top = (srcRect.top - RISE_OFFSET_PX) + "px";

        setTimeout(function () {
          // Phase 2: Move to destination
          drop.style.left = (dstRect.left + dstRect.width / 2 - DROP_HALF_WIDTH_PX) + "px";
          drop.style.top = (dstRect.top - DROP_HOVER_OFFSET_PX) + "px";

          setTimeout(function () {
            // Phase 3: Drop into destination
            var dstWaterHeight = tubes[dstIdx].length * SEGMENT_HEIGHT_PX;
            drop.style.top = (dstRect.bottom - dstWaterHeight - amount * SEGMENT_HEIGHT_PX) + "px";
            drop.style.opacity = "0.6";

            setTimeout(function () {
              if (drop.parentNode) {
                drop.parentNode.removeChild(drop);
              }
              resolve();
            }, DROP_DURATION_MS);
          }, MOVE_DURATION_MS);
        }, RISE_DURATION_MS);
      });
    });
  }

  /* ══════════════════════════════════════════════
     Game logic
  ══════════════════════════════════════════════ */
  function canPour(srcIdx, dstIdx) {
    var src = tubes[srcIdx];
    var dst = tubes[dstIdx];
    if (src.length === 0) return false;
    if (dst.length >= TUBE_CAPACITY) return false;
    if (dst.length === 0) return true;
    return topColor(src) === topColor(dst);
  }

  function pour(srcIdx, dstIdx) {
    var src = tubes[srcIdx];
    var dst = tubes[dstIdx];
    var color = topColor(src);
    var space = TUBE_CAPACITY - dst.length;
    var run   = topRunLength(src);
    var amount = Math.min(run, space);
    for (var i = 0; i < amount; i++) {
      src.pop();
      dst.push(color);
    }
    return amount;
  }

  function checkWin() {
    return tubes.every(function (tube) {
      return tube.length === 0 || isTubeSolved(tube);
    });
  }

  function onTubeClick(idx) {
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

    if (canPour(selectedTubeIndex, idx)) {
      var srcIdx = selectedTubeIndex;
      var colorIdx = topColor(tubes[srcIdx]);
      var run = topRunLength(tubes[srcIdx]);
      var space = TUBE_CAPACITY - tubes[idx].length;
      var amount = Math.min(run, space);

      history.push(cloneTubes(tubes));
      selectedTubeIndex = null;

      // Perform the pour (data)
      pour(srcIdx, idx);
      moves++;

      // Animate
      isAnimating = true;
      render();

      animatePour(srcIdx, idx, colorIdx, amount).then(function () {
        isAnimating = false;
        render();
        if (checkWin()) {
          showWin();
        }
      });
    } else {
      selectedTubeIndex = null;
      render();
      var tubeEls = tubesContainer.querySelectorAll(".tube");
      if (tubeEls[idx]) {
        tubeEls[idx].classList.add("invalid-shake");
        setTimeout(function () {
          tubeEls[idx].classList.remove("invalid-shake");
        }, 400);
      }
    }
  }

  /* ══════════════════════════════════════════════
     Win / level management
  ══════════════════════════════════════════════ */
  function showWin() {
    var levelNum = currentLevel + 1;
    markLevelComplete(levelNum);
    winDetails.textContent = "Completed in " + moves + " move" + (moves !== 1 ? "s" : "") + "!";
    winMessage.classList.remove("hidden");

    if (currentLevel >= TOTAL_LEVELS - 1) {
      nextLevelBtn.textContent = "Back to Levels";
    } else {
      nextLevelBtn.textContent = "Next Level";
    }
  }

  function startLevel(levelIndex) {
    currentLevel = levelIndex;
    tubes = generateLevel(levelIndex);
    selectedTubeIndex = null;
    moves = 0;
    history = [];
    isAnimating = false;
    winMessage.classList.add("hidden");

    homepage.classList.add("hidden");
    gameContainer.classList.remove("hidden");

    render();
  }

  /* ══════════════════════════════════════════════
     Event listeners
  ══════════════════════════════════════════════ */
  nextLevelBtn.addEventListener("click", function () {
    if (currentLevel >= TOTAL_LEVELS - 1) {
      showHomepage();
    } else {
      startLevel(currentLevel + 1);
    }
  });

  restartBtn.addEventListener("click", function () {
    startLevel(currentLevel);
  });

  undoBtn.addEventListener("click", function () {
    if (isAnimating) return;
    if (history.length === 0) return;
    tubes = history.pop();
    moves = Math.max(0, moves - 1);
    selectedTubeIndex = null;
    render();
  });

  backBtn.addEventListener("click", function () {
    showHomepage();
  });

  /* ══════════════════════════════════════════════
     Start on the homepage
  ══════════════════════════════════════════════ */
  showHomepage();
})();
