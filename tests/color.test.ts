import { describe, it, expect } from "vitest";
import { hslToHex, mulberry32, generateColors } from "../src/core/color";

describe("hslToHex", () => {
  it("should convert pure red (0, 100, 50) to #ff0000", () => {
    expect(hslToHex(0, 100, 50)).toBe("#ff0000");
  });

  it("should convert pure green (120, 100, 50) to #00ff00", () => {
    expect(hslToHex(120, 100, 50)).toBe("#00ff00");
  });

  it("should convert pure blue (240, 100, 50) to #0000ff", () => {
    expect(hslToHex(240, 100, 50)).toBe("#0000ff");
  });

  it("should convert white (0, 0, 100) to #ffffff", () => {
    expect(hslToHex(0, 0, 100)).toBe("#ffffff");
  });

  it("should convert black (0, 0, 0) to #000000", () => {
    expect(hslToHex(0, 0, 0)).toBe("#000000");
  });

  it("should handle hue wrapping (360 -> same as 0)", () => {
    expect(hslToHex(360, 100, 50)).toBe(hslToHex(0, 100, 50));
  });

  it("should handle hue > 360", () => {
    expect(hslToHex(480, 100, 50)).toBe(hslToHex(120, 100, 50));
  });

  it("should return valid hex format", () => {
    const result = hslToHex(200, 70, 50);
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("should handle all hue ranges (0-360)", () => {
    for (let h = 0; h < 360; h += 30) {
      const result = hslToHex(h, 50, 50);
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("mulberry32", () => {
  it("should return a function", () => {
    const rng = mulberry32(42);
    expect(typeof rng).toBe("function");
  });

  it("should produce values in [0, 1) range", () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("should be deterministic (same seed = same sequence)", () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it("should produce different sequences for different seeds", () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

describe("generateColors", () => {
  it("should generate the correct number of colors", () => {
    expect(generateColors(5, 0)).toHaveLength(5);
    expect(generateColors(10, 1)).toHaveLength(10);
    expect(generateColors(1, 2)).toHaveLength(1);
  });

  it("should return valid hex color strings", () => {
    const colors = generateColors(8, 0);
    colors.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("should be deterministic (same levelIndex = same colors)", () => {
    const colors1 = generateColors(6, 42);
    const colors2 = generateColors(6, 42);
    expect(colors1).toEqual(colors2);
  });

  it("should produce different colors for different levels", () => {
    const colors1 = generateColors(6, 0);
    const colors2 = generateColors(6, 1);
    expect(colors1).not.toEqual(colors2);
  });

  it("should generate distinct colors", () => {
    const colors = generateColors(10, 0);
    const unique = new Set(colors);
    // With 10 colors and golden angle spacing, all should be unique
    expect(unique.size).toBe(10);
  });

  it("should handle edge case of 0 colors", () => {
    expect(generateColors(0, 0)).toHaveLength(0);
  });
});
