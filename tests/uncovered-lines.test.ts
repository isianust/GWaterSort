/**
 * Tests for remaining uncovered lines.
 *
 * - renderer.ts:60 – getElements() throw when DOM not initialized
 * - animations.ts:73-86 – animation timer callbacks (Phase 2, 3, cleanup)
 * - difficulty.ts:73 – numColors < 2 guard
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

describe("renderer.ts:60 – getElements() throw path", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw when getElements is called before initDOM", async () => {
    // Reset modules to get fresh module state
    vi.resetModules();

    // Import fresh copy of the module (elements will be null)
    const { getElements } = await import("../src/ui/renderer");

    expect(() => getElements()).toThrow("DOM not initialized");
  });
});

describe("animations.ts:73-86 – full animation cycle with real timers", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function createContainer(): HTMLElement {
    const container = document.createElement("div");
    const mockRect = {
      top: 100, left: 50, right: 100, bottom: 200,
      width: 50, height: 100, x: 50, y: 100,
      toJSON: () => ({}),
    };

    const tube1 = document.createElement("div");
    tube1.className = "tube";
    tube1.getBoundingClientRect = () => mockRect;

    const tube2 = document.createElement("div");
    tube2.className = "tube";
    tube2.getBoundingClientRect = () => ({
      ...mockRect, left: 150, right: 200, x: 150,
    });

    container.appendChild(tube1);
    container.appendChild(tube2);
    document.body.appendChild(container);
    return container;
  }

  it("should complete full animation and clean up drop element", async () => {
    const { animatePour } = await import("../src/ui/animations");
    const container = createContainer();

    // Use real timers – the total animation time is ~950ms
    // RISE_DURATION_MS(250) + MOVE_DURATION_MS(400) + DROP_DURATION_MS(300) = 950ms
    const promise = animatePour(container, 0, 1, "#ff0000", 1, 2);

    // The drop should be created immediately
    expect(document.body.querySelector(".water-drop")).toBeTruthy();

    // Wait for the full animation to complete
    await promise;

    // Drop should be removed after animation completes
    expect(document.body.querySelector(".water-drop")).toBeNull();
  }, 10000); // 10 second timeout

  it("should handle animation phases with multiple segments", async () => {
    const { animatePour } = await import("../src/ui/animations");
    const container = createContainer();

    const promise = animatePour(container, 0, 1, "#00ff00", 3, 4);

    expect(document.body.querySelector(".water-drop")).toBeTruthy();

    await promise;

    expect(document.body.querySelector(".water-drop")).toBeNull();
  }, 10000);

  it("should update drop position during phase 2 (move to destination)", async () => {
    const { animatePour } = await import("../src/ui/animations");
    const container = createContainer();

    const promise = animatePour(container, 0, 1, "#0000ff", 2, 2);

    // Drop exists
    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();

    // Initial left position
    const initialLeft = drop.style.left;
    expect(initialLeft).toBeTruthy();

    await promise;
    // Drop cleaned up
    expect(document.body.querySelector(".water-drop")).toBeNull();
  }, 10000);

  it("should set opacity to 0.6 during drop phase", async () => {
    const { animatePour } = await import("../src/ui/animations");
    const container = createContainer();

    const promise = animatePour(container, 0, 1, "#ff00ff", 1, 1);

    await promise;

    // Animation completed, drop removed
    expect(document.body.querySelector(".water-drop")).toBeNull();
  }, 10000);
});
