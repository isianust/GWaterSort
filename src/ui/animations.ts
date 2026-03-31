/**
 * Pour animation module.
 *
 * Handles the visual animation of water being poured between tubes.
 */

import {
  SEGMENT_HEIGHT_PX,
  RISE_OFFSET_PX,
  DROP_HOVER_OFFSET_PX,
  INITIAL_DROP_OFFSET_PX,
  DROP_HALF_WIDTH_PX,
  DROP_WIDTH_PX,
  RISE_DURATION_MS,
  MOVE_DURATION_MS,
  DROP_DURATION_MS,
  ANIMATION_EASING,
} from "../core/types";

/**
 * Animate pouring water from one tube to another.
 *
 * @param tubesContainer - DOM element containing tube elements
 * @param srcIdx - Source tube index
 * @param dstIdx - Destination tube index
 * @param color - CSS color string for the water drop
 * @param amount - Number of segments being poured
 * @param dstWaterCount - Number of segments in destination after pour
 * @returns Promise that resolves when animation completes
 */
export function animatePour(
  tubesContainer: HTMLElement,
  srcIdx: number,
  dstIdx: number,
  color: string,
  amount: number,
  dstWaterCount: number,
): Promise<void> {
  return new Promise((resolve) => {
    const tubeEls = tubesContainer.querySelectorAll(".tube");
    const srcEl = tubeEls[srcIdx] as HTMLElement | undefined;
    const dstEl = tubeEls[dstIdx] as HTMLElement | undefined;

    if (!srcEl || !dstEl) {
      resolve();
      return;
    }

    const srcRect = srcEl.getBoundingClientRect();
    const dstRect = dstEl.getBoundingClientRect();

    // Create the animated water drop
    const drop = document.createElement("div");
    drop.className = "water-drop";
    drop.style.backgroundColor = color;
    drop.style.width = DROP_WIDTH_PX + "px";
    drop.style.height = amount * SEGMENT_HEIGHT_PX + "px";
    drop.style.position = "fixed";
    drop.style.left = srcRect.left + srcRect.width / 2 - DROP_HALF_WIDTH_PX + "px";
    drop.style.top = srcRect.top - INITIAL_DROP_OFFSET_PX + "px";
    drop.style.zIndex = "1000";
    drop.style.borderRadius = "8px";
    drop.style.opacity = "0.9";
    drop.style.transition = `all ${MOVE_DURATION_MS / 1000}s ${ANIMATION_EASING}`;
    document.body.appendChild(drop);

    // Phase 1: Rise up from source
    requestAnimationFrame(() => {
      drop.style.top = srcRect.top - RISE_OFFSET_PX + "px";

      setTimeout(() => {
        // Phase 2: Move to destination
        drop.style.left = dstRect.left + dstRect.width / 2 - DROP_HALF_WIDTH_PX + "px";
        drop.style.top = dstRect.top - DROP_HOVER_OFFSET_PX + "px";

        setTimeout(() => {
          // Phase 3: Drop into destination
          const dstWaterHeight = dstWaterCount * SEGMENT_HEIGHT_PX;
          drop.style.top = dstRect.bottom - dstWaterHeight - amount * SEGMENT_HEIGHT_PX + "px";
          drop.style.opacity = "0.6";

          setTimeout(() => {
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
