/**
 * Animation module tests.
 *
 * Tests for the pour animation function using jsdom.
 * Note: requestAnimationFrame + fake timers is tricky in jsdom,
 * so we test the early-exit paths and basic structure.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { animatePour } from "../src/ui/animations";

function setupAnimationDOM(): HTMLElement {
  document.body.innerHTML = "";
  const container = document.createElement("div");
  container.id = "tubes-container";

  // Create two tube elements
  const tube1 = document.createElement("div");
  tube1.className = "tube";
  const tube2 = document.createElement("div");
  tube2.className = "tube";

  container.appendChild(tube1);
  container.appendChild(tube2);
  document.body.appendChild(container);

  return container;
}

describe("animatePour", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should resolve immediately if source tube element is missing", async () => {
    const container = document.createElement("div");
    container.id = "tubes-container";
    // No tubes inside — srcIdx 0 won't find anything

    await animatePour(container, 0, 1, "#ff0000", 1, 1);
    // If we get here, the promise resolved without error
    expect(true).toBe(true);
  });

  it("should resolve immediately if destination tube element is missing", async () => {
    const container = document.createElement("div");
    container.id = "tubes-container";
    const tube1 = document.createElement("div");
    tube1.className = "tube";
    container.appendChild(tube1);
    // Only one tube, dest index 1 is missing

    await animatePour(container, 0, 1, "#ff0000", 1, 1);
    expect(true).toBe(true);
  });

  it("should resolve immediately when both tubes are missing", async () => {
    const container = document.createElement("div");
    await animatePour(container, 5, 10, "#ff0000", 2, 3);
    expect(true).toBe(true);
  });

  it("should accept valid arguments without throwing", () => {
    const container = setupAnimationDOM();

    // Mock getBoundingClientRect for both tubes
    const tubes = container.querySelectorAll(".tube");
    const mockRect = {
      top: 100, left: 50, right: 100, bottom: 200,
      width: 50, height: 100, x: 50, y: 100,
      toJSON: () => ({}),
    };
    (tubes[0] as HTMLElement).getBoundingClientRect = () => mockRect;
    (tubes[1] as HTMLElement).getBoundingClientRect = () => ({
      ...mockRect, left: 150, right: 200, x: 150,
    });

    // Calling animatePour should not throw
    // We don't await because the animation relies on requestAnimationFrame + setTimeout
    // which is difficult to test with fake timers in jsdom
    expect(() => {
      animatePour(container, 0, 1, "#ff0000", 2, 3);
    }).not.toThrow();
  });

  it("should create a water-drop element during animation", () => {
    const container = setupAnimationDOM();

    const tubes = container.querySelectorAll(".tube");
    const mockRect = {
      top: 100, left: 50, right: 100, bottom: 200,
      width: 50, height: 100, x: 50, y: 100,
      toJSON: () => ({}),
    };
    (tubes[0] as HTMLElement).getBoundingClientRect = () => mockRect;
    (tubes[1] as HTMLElement).getBoundingClientRect = () => ({
      ...mockRect, left: 150, right: 200, x: 150,
    });

    // Start animation (don't await — just check that the drop was created)
    animatePour(container, 0, 1, "#00ff00", 1, 2);

    // After requestAnimationFrame fires, a water-drop should exist in the body
    // Force requestAnimationFrame callback (jsdom supports it)
    // Note: The drop is created inside requestAnimationFrame, but the element
    // is appended to document.body before requestAnimationFrame.
    // Check: drop is appended immediately (before rAF)
    const drops = document.body.querySelectorAll(".water-drop");
    expect(drops.length).toBe(1);
    expect((drops[0] as HTMLElement).style.backgroundColor).toBeTruthy();
  });
});
