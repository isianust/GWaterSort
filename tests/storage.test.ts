import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProgress,
  saveProgress,
  markLevelComplete,
  getCompletedCount,
} from "../src/core/storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("loadProgress", () => {
    it("should return empty progress when no data exists", () => {
      const progress = loadProgress();
      expect(progress).toEqual({ completed: {} });
    });

    it("should return saved progress data", () => {
      localStorage.setItem("waterSortProgress", JSON.stringify({ completed: { 1: true, 5: true } }));
      const progress = loadProgress();
      expect(progress.completed[1]).toBe(true);
      expect(progress.completed[5]).toBe(true);
    });

    it("should handle corrupted data gracefully", () => {
      localStorage.setItem("waterSortProgress", "not-valid-json{{{");
      const progress = loadProgress();
      expect(progress).toEqual({ completed: {} });
    });
  });

  describe("saveProgress", () => {
    it("should persist progress to localStorage", () => {
      saveProgress({ completed: { 3: true, 7: true } });
      const raw = localStorage.getItem("waterSortProgress");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.completed[3]).toBe(true);
      expect(parsed.completed[7]).toBe(true);
    });
  });

  describe("markLevelComplete", () => {
    it("should mark a level as completed", () => {
      markLevelComplete(1);
      const progress = loadProgress();
      expect(progress.completed[1]).toBe(true);
    });

    it("should preserve previously completed levels", () => {
      markLevelComplete(1);
      markLevelComplete(5);
      markLevelComplete(10);
      const progress = loadProgress();
      expect(progress.completed[1]).toBe(true);
      expect(progress.completed[5]).toBe(true);
      expect(progress.completed[10]).toBe(true);
    });

    it("should handle re-completing the same level", () => {
      markLevelComplete(1);
      markLevelComplete(1);
      const progress = loadProgress();
      expect(progress.completed[1]).toBe(true);
      expect(getCompletedCount()).toBe(1);
    });
  });

  describe("getCompletedCount", () => {
    it("should return 0 when no levels completed", () => {
      expect(getCompletedCount()).toBe(0);
    });

    it("should return correct count of completed levels", () => {
      markLevelComplete(1);
      markLevelComplete(2);
      markLevelComplete(3);
      expect(getCompletedCount()).toBe(3);
    });
  });
});
