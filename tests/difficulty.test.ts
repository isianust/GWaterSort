import { describe, it, expect } from "vitest";
import {
  getDifficulty,
  getDifficultyStars,
  getDifficultyLabel,
  getLevelConfig,
} from "../src/core/difficulty";

describe("getDifficulty", () => {
  it("should return base difficulty for non-milestone levels", () => {
    expect(getDifficulty(1)).toBe(1);
    expect(getDifficulty(3)).toBe(3);
    expect(getDifficulty(7)).toBe(7);
  });

  it("should add bonus for multiples of 5", () => {
    // Level 5: base=5, bonus5=floor(5/5)=1, total=6
    expect(getDifficulty(5)).toBe(6);
    // Level 15: base=15, bonus5=floor(15/5)=3, total=18
    expect(getDifficulty(15)).toBe(18);
  });

  it("should add both bonuses for multiples of 10", () => {
    // Level 10: base=10, bonus5=floor(10/5)=2, bonus10=floor(10/10)=1, total=13
    expect(getDifficulty(10)).toBe(13);
    // Level 50: base=50, bonus5=10, bonus10=5, total=65
    expect(getDifficulty(50)).toBe(65);
    // Level 100: base=100, bonus5=20, bonus10=10, total=130
    expect(getDifficulty(100)).toBe(130);
  });

  it("should generally increase for sequential levels", () => {
    // Difficulty is not strictly monotonic because bonus only applies at milestones
    // but it should trend upward overall
    const d1 = getDifficulty(1);
    const d50 = getDifficulty(50);
    const d100 = getDifficulty(100);
    expect(d50).toBeGreaterThan(d1);
    expect(d100).toBeGreaterThan(d50);
  });

  it("should spike at milestone levels (5, 10)", () => {
    // Level 10 should have higher difficulty than level 9
    expect(getDifficulty(10)).toBeGreaterThan(getDifficulty(9));
    // Level 5 should have higher difficulty than level 4
    expect(getDifficulty(5)).toBeGreaterThan(getDifficulty(4));
  });
});

describe("getDifficultyStars", () => {
  it("should return 1 star for easy levels (difficulty <= 10)", () => {
    expect(getDifficultyStars(1)).toBe(1); // diff=1
    expect(getDifficultyStars(9)).toBe(1); // diff=9
  });

  it("should return 2 stars for normal levels (difficulty 11–25)", () => {
    expect(getDifficultyStars(11)).toBe(2); // diff=11
    expect(getDifficultyStars(18)).toBe(2); // diff=18
  });

  it("should return 3 stars for hard levels (difficulty 26–50)", () => {
    expect(getDifficultyStars(26)).toBe(3); // diff=26
    expect(getDifficultyStars(38)).toBe(3); // diff=38
  });

  it("should return 4 stars for expert levels (difficulty 51–80)", () => {
    expect(getDifficultyStars(51)).toBe(4); // diff=51
  });

  it("should return 5 stars for master levels (difficulty > 80)", () => {
    expect(getDifficultyStars(100)).toBe(5); // diff=130
  });
});

describe("getDifficultyLabel", () => {
  it("should return correct labels for each star count", () => {
    expect(getDifficultyLabel(1)).toBe("Easy");
    expect(getDifficultyLabel(2)).toBe("Normal");
    expect(getDifficultyLabel(3)).toBe("Hard");
    expect(getDifficultyLabel(4)).toBe("Expert");
    expect(getDifficultyLabel(5)).toBe("Master");
  });

  it("should return 'Master' for unexpected star counts", () => {
    expect(getDifficultyLabel(6)).toBe("Master");
    expect(getDifficultyLabel(0)).toBe("Master");
  });
});

describe("getLevelConfig", () => {
  it("should return at least 2 colors for level 1", () => {
    const config = getLevelConfig(1);
    expect(config.colors).toBeGreaterThanOrEqual(2);
  });

  it("should return 2 empty tubes for easier levels", () => {
    const config = getLevelConfig(1);
    expect(config.emptyTubes).toBe(2);
  });

  it("should return 1 empty tube for high difficulty levels", () => {
    // Level 100 has difficulty 130, which is > 60
    const config = getLevelConfig(100);
    expect(config.emptyTubes).toBe(1);
  });

  it("should cap colors at MAX_COLORS (20)", () => {
    const config = getLevelConfig(100);
    expect(config.colors).toBeLessThanOrEqual(20);
  });

  it("should increase colors as levels progress", () => {
    const config1 = getLevelConfig(1);
    const config50 = getLevelConfig(50);
    const config100 = getLevelConfig(100);
    expect(config50.colors).toBeGreaterThan(config1.colors);
    expect(config100.colors).toBeGreaterThan(config50.colors);
  });

  it("should return valid config structure", () => {
    for (let i = 1; i <= 100; i++) {
      const config = getLevelConfig(i);
      expect(config.colors).toBeGreaterThanOrEqual(2);
      expect(config.colors).toBeLessThanOrEqual(20);
      expect([1, 2]).toContain(config.emptyTubes);
    }
  });
});
