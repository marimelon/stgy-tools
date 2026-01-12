import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearAllEditKeys,
	getStoredEditKey,
	removeEditKey,
	saveEditKey,
} from "../editKeyStorage";

const STORAGE_KEY = "strategy-board-edit-keys";

describe("editKeyStorage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe("getStoredEditKey", () => {
		it("returns null when no key is stored", () => {
			expect(getStoredEditKey("group1")).toBeNull();
		});

		it("returns null when storage is empty", () => {
			localStorage.setItem(STORAGE_KEY, "{}");
			expect(getStoredEditKey("group1")).toBeNull();
		});

		it("returns stored key for existing group", () => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ group1: "editKey123" }),
			);
			expect(getStoredEditKey("group1")).toBe("editKey123");
		});

		it("returns null for non-existent group", () => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ group1: "editKey123" }),
			);
			expect(getStoredEditKey("group2")).toBeNull();
		});

		it("handles invalid JSON gracefully", () => {
			localStorage.setItem(STORAGE_KEY, "invalid json");
			expect(getStoredEditKey("group1")).toBeNull();
		});
	});

	describe("saveEditKey", () => {
		it("saves new key to empty storage", () => {
			saveEditKey("group1", "editKey123");

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
			expect(stored.group1).toBe("editKey123");
		});

		it("adds key to existing storage", () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ group1: "key1" }));

			saveEditKey("group2", "key2");

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
			expect(stored.group1).toBe("key1");
			expect(stored.group2).toBe("key2");
		});

		it("overwrites existing key for same group", () => {
			saveEditKey("group1", "oldKey");
			saveEditKey("group1", "newKey");

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
			expect(stored.group1).toBe("newKey");
		});

		it("handles localStorage errors gracefully", () => {
			const setItemSpy = vi
				.spyOn(Storage.prototype, "setItem")
				.mockImplementation(() => {
					throw new Error("Storage full");
				});

			// Should not throw
			expect(() => saveEditKey("group1", "key")).not.toThrow();

			setItemSpy.mockRestore();
		});
	});

	describe("removeEditKey", () => {
		it("removes existing key", () => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ group1: "key1", group2: "key2" }),
			);

			removeEditKey("group1");

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
			expect(stored.group1).toBeUndefined();
			expect(stored.group2).toBe("key2");
		});

		it("does nothing for non-existent key", () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ group1: "key1" }));

			removeEditKey("group2");

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
			expect(stored.group1).toBe("key1");
		});

		it("removes storage when last key is removed", () => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ group1: "key1" }));

			removeEditKey("group1");

			expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		});
	});

	describe("clearAllEditKeys", () => {
		it("clears all stored keys", () => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ group1: "key1", group2: "key2" }),
			);

			clearAllEditKeys();

			expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		});

		it("does nothing when storage is empty", () => {
			clearAllEditKeys();
			expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		});
	});
});
