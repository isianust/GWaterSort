# GWaterSort – Water Color Sort Puzzle

A browser-based **Water Color Sort** puzzle game built with HTML, CSS, and JavaScript.

## How to Play

1. **Open** `index.html` in any modern browser.
2. **Click** a tube to select it (it rises up).
3. **Click** another tube to pour – the top matching-color segments move to the destination.
4. **Goal:** Sort the water so every tube contains only one color.

### Rules

- You can only pour into a tube that is **empty** or whose top color **matches** the color being poured.
- A tube can hold at most **4** segments.
- Use **Undo** to take back a move, or **Restart Level** to start over.

## Features

- 50 progressively harder levels (2 → 14 colors)
- Difficulty tiers: Beginner → Easy → Medium → Challenging → Hard → Expert
- Undo & restart support
- Move counter
- Win detection with next-level prompt
- Responsive design for mobile and desktop
- No external dependencies

## Project Structure

```
index.html   – Game page
style.css    – Styling & animations
script.js    – Game logic
```
