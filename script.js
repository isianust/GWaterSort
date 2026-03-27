(function () {
  "use strict";

  /* ──────────────────────────────────────────────
     Color definitions
  ────────────────────────────────────────────── */
  var COLORS = [
    "red", "blue", "green", "yellow", "purple",
    "orange", "pink", "teal", "brown", "gray",
    "lime", "navy"
  ];

  var TUBE_CAPACITY = 4;

  /* ──────────────────────────────────────────────
     Level definitions
     Each level: { colors: number, emptyTubes: number }
     Total tubes = colors + emptyTubes
  ────────────────────────────────────────────── */
  var LEVELS = [
    { colors: 2, emptyTubes: 1 },
    { colors: 3, emptyTubes: 1 },
    { colors: 4, emptyTubes: 2 },
    { colors: 5, emptyTubes: 2 },
    { colors: 6, emptyTubes: 2 },
    { colors: 7, emptyTubes: 2 },
    { colors: 8, emptyTubes: 2 },
    { colors: 9, emptyTubes: 2 },
    { colors: 10, emptyTubes: 2 },
    { colors: 11, emptyTubes: 2 },
    { colors: 12, emptyTubes: 2 }
  ];

  /* ──────────────────────────────────────────────
     Game state
  ────────────────────────────────────────────── */
  var currentLevel = 0;
  var tubes = [];          // Array of arrays – each inner array holds color strings (bottom → top)
  var selectedTubeIndex = null;
  var moves = 0;
  var history = [];        // For undo: array of previous tube snapshots

  /* ──────────────────────────────────────────────
     DOM references
  ────────────────────────────────────────────── */
  var tubesContainer = document.getElementById("tubes-container");
  var levelDisplay   = document.getElementById("level-display");
  var movesDisplay   = document.getElementById("moves-display");
  var winMessage     = document.getElementById("win-message");
  var winDetails     = document.getElementById("win-details");
  var nextLevelBtn   = document.getElementById("next-level-btn");
  var undoBtn        = document.getElementById("undo-btn");
  var restartBtn     = document.getElementById("restart-btn");

  /* ──────────────────────────────────────────────
     Utilities
  ────────────────────────────────────────────── */

  /** Deep-clone the tubes array for undo / restart */
  function cloneTubes(src) {
    return src.map(function (t) { return t.slice(); });
  }

  /** Fisher–Yates shuffle (in-place) */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /** Check whether a single tube is "solved" (full of one color) */
  function isTubeSolved(tube) {
    return tube.length === TUBE_CAPACITY &&
           tube.every(function (c) { return c === tube[0]; });
  }

  /** Get top color of a tube (last element) */
  function topColor(tube) {
    return tube.length > 0 ? tube[tube.length - 1] : null;
  }

  /** Count consecutive same-color segments from the top */
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

  /* ──────────────────────────────────────────────
     Level generation
  ────────────────────────────────────────────── */
  function generateLevel(levelIndex) {
    var lvl = LEVELS[Math.min(levelIndex, LEVELS.length - 1)];
    var numColors  = lvl.colors;
    var emptyTubes = lvl.emptyTubes;

    // Build a flat array with TUBE_CAPACITY copies of each color
    var segments = [];
    for (var c = 0; c < numColors; c++) {
      for (var s = 0; s < TUBE_CAPACITY; s++) {
        segments.push(COLORS[c]);
      }
    }

    // Shuffle until the puzzle is NOT already solved
    var attempts = 0;
    do {
      shuffle(segments);
      attempts++;
    } while (isPuzzleTrivial(segments, numColors) && attempts < 200);

    // Fallback: if still trivial, manually swap the first two segments
    if (isPuzzleTrivial(segments, numColors) && segments.length >= 2) {
      var tmp = segments[0];
      segments[0] = segments[segments.length - 1];
      segments[segments.length - 1] = tmp;
    }

    // Distribute into tubes
    var result = [];
    for (var t = 0; t < numColors; t++) {
      result.push(segments.slice(t * TUBE_CAPACITY, (t + 1) * TUBE_CAPACITY));
    }
    for (var e = 0; e < emptyTubes; e++) {
      result.push([]);
    }
    return result;
  }

  /** A puzzle is trivial if every tube is already sorted */
  function isPuzzleTrivial(segments, numColors) {
    for (var t = 0; t < numColors; t++) {
      var slice = segments.slice(t * TUBE_CAPACITY, (t + 1) * TUBE_CAPACITY);
      var allSame = slice.every(function (c) { return c === slice[0]; });
      if (!allSame) return false;
    }
    return true;
  }

  /* ──────────────────────────────────────────────
     Rendering
  ────────────────────────────────────────────── */
  function render() {
    tubesContainer.innerHTML = "";

    tubes.forEach(function (tube, idx) {
      var el = document.createElement("div");
      el.className = "tube";
      if (idx === selectedTubeIndex) el.classList.add("selected");

      // Water segments (rendered bottom → top via column-reverse)
      tube.forEach(function (color) {
        var seg = document.createElement("div");
        seg.className = "water-segment color-" + color;
        el.appendChild(seg);
      });

      el.addEventListener("click", function () { onTubeClick(idx); });
      tubesContainer.appendChild(el);
    });

    levelDisplay.textContent = "Level: " + (currentLevel + 1);
    movesDisplay.textContent = "Moves: " + moves;
  }

  /* ──────────────────────────────────────────────
     Game logic
  ────────────────────────────────────────────── */

  /** Can we pour from src tube into dst tube? */
  function canPour(srcIdx, dstIdx) {
    var src = tubes[srcIdx];
    var dst = tubes[dstIdx];
    if (src.length === 0) return false;
    if (dst.length >= TUBE_CAPACITY) return false;
    if (dst.length === 0) return true;
    return topColor(src) === topColor(dst);
  }

  /** Pour top matching segments from src into dst */
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
  }

  /** Check if the entire puzzle is solved */
  function checkWin() {
    return tubes.every(function (tube) {
      return tube.length === 0 || isTubeSolved(tube);
    });
  }

  /** Handle a tube click */
  function onTubeClick(idx) {
    if (selectedTubeIndex === null) {
      // Select a tube (ignore empty tubes)
      if (tubes[idx].length === 0) return;
      selectedTubeIndex = idx;
      render();
      return;
    }

    if (selectedTubeIndex === idx) {
      // Deselect
      selectedTubeIndex = null;
      render();
      return;
    }

    // Attempt to pour
    if (canPour(selectedTubeIndex, idx)) {
      history.push(cloneTubes(tubes));
      pour(selectedTubeIndex, idx);
      moves++;
      selectedTubeIndex = null;
      render();

      if (checkWin()) {
        showWin();
      }
    } else {
      // Invalid move – shake
      selectedTubeIndex = null;
      render();
      var tubeEls = tubesContainer.querySelectorAll(".tube");
      tubeEls[idx].classList.add("invalid-shake");
      setTimeout(function () {
        tubeEls[idx].classList.remove("invalid-shake");
      }, 400);
    }
  }

  /* ──────────────────────────────────────────────
     Win / level management
  ────────────────────────────────────────────── */
  function showWin() {
    winDetails.textContent = "Completed in " + moves + " move" + (moves !== 1 ? "s" : "") + "!";
    winMessage.classList.remove("hidden");

    // Hide "Next Level" if all levels are done
    if (currentLevel >= LEVELS.length - 1) {
      nextLevelBtn.textContent = "Play Again";
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
    winMessage.classList.add("hidden");
    render();
  }

  /* ──────────────────────────────────────────────
     Event listeners
  ────────────────────────────────────────────── */
  nextLevelBtn.addEventListener("click", function () {
    if (currentLevel >= LEVELS.length - 1) {
      startLevel(0); // Restart from level 1
    } else {
      startLevel(currentLevel + 1);
    }
  });

  restartBtn.addEventListener("click", function () {
    startLevel(currentLevel);
  });

  undoBtn.addEventListener("click", function () {
    if (history.length === 0) return;
    tubes = history.pop();
    moves = Math.max(0, moves - 1);
    selectedTubeIndex = null;
    render();
  });

  /* ──────────────────────────────────────────────
     Start the game
  ────────────────────────────────────────────── */
  startLevel(0);
})();
