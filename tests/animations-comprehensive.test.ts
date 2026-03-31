/**
 * Comprehensive animation tests.
 *
 * Tests animation element creation, style properties, and edge cases.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { animatePour } from "../src/ui/animations";
import {
  DROP_WIDTH_PX,
  SEGMENT_HEIGHT_PX,
} from "../src/core/types";

function createTubeContainer(count: number): HTMLElement {
  const container = document.createElement("div");
  container.id = "tubes-container";

  for (let i = 0; i < count; i++) {
    const tube = document.createElement("div");
    tube.className = "tube";
    tube.getBoundingClientRect = () => ({
      top: 100,
      left: 50 + i * 80,
      right: 100 + i * 80,
      bottom: 260,
      width: 50,
      height: 160,
      x: 50 + i * 80,
      y: 100,
      toJSON: () => ({}),
    });
    container.appendChild(tube);
  }

  document.body.appendChild(container);
  return container;
}

describe("animatePour: element creation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should create a water-drop element with correct width", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "#ff0000", 1, 2);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
    expect(drop.style.width).toBe(DROP_WIDTH_PX + "px");
  });

  it("should set water-drop height based on amount", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "#ff0000", 3, 4);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
    expect(drop.style.height).toBe(3 * SEGMENT_HEIGHT_PX + "px");
  });

  it("should set water-drop background color", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "#00ff00", 1, 1);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
    expect(drop.style.backgroundColor).toBeTruthy();
  });

  it("should set fixed positioning on the drop", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "#0000ff", 2, 3);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
    expect(drop.style.position).toBe("fixed");
    expect(drop.style.zIndex).toBe("1000");
  });

  it("should set border radius and opacity on the drop", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "#ff00ff", 1, 1);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
    expect(drop.style.borderRadius).toBe("8px");
    expect(drop.style.opacity).toBe("0.9");
  });

  it("should set CSS transition on the drop", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "#aabbcc", 1, 1);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
    expect(drop.style.transition).toBeTruthy();
    expect(drop.style.transition).toContain("all");
  });
});

describe("animatePour: missing elements", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should resolve immediately if no tubes in container", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    await animatePour(container, 0, 1, "#ff0000", 1, 1);
    // No drop should be created
    expect(document.body.querySelector(".water-drop")).toBeNull();
  });

  it("should resolve immediately if only source tube exists", async () => {
    const container = document.createElement("div");
    const tube = document.createElement("div");
    tube.className = "tube";
    container.appendChild(tube);
    document.body.appendChild(container);

    await animatePour(container, 0, 1, "#ff0000", 1, 1);
    expect(document.body.querySelector(".water-drop")).toBeNull();
  });

  it("should resolve immediately if source index out of range", async () => {
    const container = createTubeContainer(2);

    await animatePour(container, 5, 0, "#ff0000", 1, 1);
    expect(document.body.querySelector(".water-drop")).toBeNull();
  });
});

describe("animatePour: animation completion", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should create a drop that will be cleaned up", () => {
    const container = createTubeContainer(2);

    // Start animation (we can't easily test full completion with fake timers
    // due to requestAnimationFrame + setTimeout interaction in jsdom)
    animatePour(container, 0, 1, "#ff0000", 1, 2);

    // Verify the drop was created
    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
    expect(drop.parentNode).toBe(document.body);
  });

  it("should handle animation with amount=4 (full tube)", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "#ff0000", 4, 4);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
    expect(drop.style.height).toBe(4 * SEGMENT_HEIGHT_PX + "px");
  });

  it("should set initial position based on source tube rect", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "#ff0000", 2, 3);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
    // left should be based on source tube rect
    expect(drop.style.left).toBeTruthy();
    expect(drop.style.top).toBeTruthy();
  });
});

describe("animatePour: parameter edge cases", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should handle amount=1", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "#ff0000", 1, 1);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
    expect(drop.style.height).toBe(SEGMENT_HEIGHT_PX + "px");
  });

  it("should handle dstWaterCount=0 (pouring into empty tube)", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "#ff0000", 2, 0);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
  });

  it("should handle different color strings", () => {
    const container = createTubeContainer(2);

    animatePour(container, 0, 1, "rgb(255, 0, 0)", 1, 1);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
  });

  it("should handle adjacent tube indices (0,1)", () => {
    const container = createTubeContainer(3);

    animatePour(container, 0, 1, "#ff0000", 1, 1);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
  });

  it("should handle non-adjacent tube indices (0,2)", () => {
    const container = createTubeContainer(3);

    animatePour(container, 0, 2, "#ff0000", 1, 1);

    const drop = document.body.querySelector(".water-drop") as HTMLElement;
    expect(drop).toBeTruthy();
  });
});
