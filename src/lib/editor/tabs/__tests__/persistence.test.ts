/**
 * Tab persistence unit tests
 */

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import {
	clearTabState,
	loadTabState,
	saveTabStateImmediate,
} from "../persistence";
import { TABS_STORAGE_KEY } from "../types";

describe("tab persistence", () => {
	let getItemSpy: MockInstance;
	let setItemSpy: MockInstance;
	let removeItemSpy: MockInstance;

	beforeEach(() => {
		// Mock localStorage
		getItemSpy = vi.spyOn(Storage.prototype, "getItem");
		setItemSpy = vi.spyOn(Storage.prototype, "setItem");
		removeItemSpy = vi.spyOn(Storage.prototype, "removeItem");
	});

	afterEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	describe("loadTabState", () => {
		it("returns null when no saved state", () => {
			getItemSpy.mockReturnValue(null);

			const result = loadTabState();

			expect(result).toBeNull();
			expect(getItemSpy).toHaveBeenCalledWith(TABS_STORAGE_KEY);
		});

		it("loads valid state", () => {
			const savedState = {
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
			};
			getItemSpy.mockReturnValue(JSON.stringify(savedState));

			const result = loadTabState();

			expect(result).toEqual(savedState);
		});

		it("loads state with null activeTabId", () => {
			const savedState = {
				openTabs: ["board-1"],
				activeTabId: null,
			};
			getItemSpy.mockReturnValue(JSON.stringify(savedState));

			const result = loadTabState();

			expect(result).toEqual(savedState);
		});

		it("returns null for invalid JSON", () => {
			getItemSpy.mockReturnValue("invalid json {");

			const result = loadTabState();

			expect(result).toBeNull();
		});

		it("returns null for non-object state", () => {
			getItemSpy.mockReturnValue(JSON.stringify("string"));

			const result = loadTabState();

			expect(result).toBeNull();
		});

		it("returns null for null state", () => {
			getItemSpy.mockReturnValue(JSON.stringify(null));

			const result = loadTabState();

			expect(result).toBeNull();
		});

		it("returns null for state without openTabs array", () => {
			getItemSpy.mockReturnValue(JSON.stringify({ activeTabId: "board-1" }));

			const result = loadTabState();

			expect(result).toBeNull();
		});

		it("returns null for state with non-array openTabs", () => {
			getItemSpy.mockReturnValue(
				JSON.stringify({ openTabs: "not-array", activeTabId: "board-1" }),
			);

			const result = loadTabState();

			expect(result).toBeNull();
		});

		it("returns null for state with non-string array elements", () => {
			getItemSpy.mockReturnValue(
				JSON.stringify({
					openTabs: ["board-1", 123, "board-2"],
					activeTabId: "board-1",
				}),
			);

			const result = loadTabState();

			expect(result).toBeNull();
		});

		it("returns null for state with non-string activeTabId", () => {
			getItemSpy.mockReturnValue(
				JSON.stringify({ openTabs: ["board-1"], activeTabId: 123 }),
			);

			const result = loadTabState();

			expect(result).toBeNull();
		});

		it("returns null when localStorage throws", () => {
			getItemSpy.mockImplementation(() => {
				throw new Error("localStorage error");
			});

			const result = loadTabState();

			expect(result).toBeNull();
		});
	});

	describe("saveTabStateImmediate", () => {
		it("saves state to localStorage", () => {
			const state = {
				openTabs: ["board-1", "board-2"],
				activeTabId: "board-1",
			};

			saveTabStateImmediate(state);

			expect(setItemSpy).toHaveBeenCalledWith(
				TABS_STORAGE_KEY,
				JSON.stringify({
					openTabs: ["board-1", "board-2"],
					activeTabId: "board-1",
				}),
			);
		});

		it("saves state with null activeTabId", () => {
			const state = {
				openTabs: ["board-1"],
				activeTabId: null,
			};

			saveTabStateImmediate(state);

			expect(setItemSpy).toHaveBeenCalledWith(
				TABS_STORAGE_KEY,
				JSON.stringify({
					openTabs: ["board-1"],
					activeTabId: null,
				}),
			);
		});

		it("handles localStorage errors gracefully", () => {
			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});
			setItemSpy.mockImplementation(() => {
				throw new Error("localStorage full");
			});

			const state = {
				openTabs: ["board-1"],
				activeTabId: "board-1",
			};

			expect(() => saveTabStateImmediate(state)).not.toThrow();
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				"Failed to save tab state:",
				expect.any(Error),
			);

			consoleWarnSpy.mockRestore();
		});
	});

	describe("clearTabState", () => {
		it("removes state from localStorage", () => {
			clearTabState();

			expect(removeItemSpy).toHaveBeenCalledWith(TABS_STORAGE_KEY);
		});

		it("handles localStorage errors gracefully", () => {
			removeItemSpy.mockImplementation(() => {
				throw new Error("localStorage error");
			});

			expect(() => clearTabState()).not.toThrow();
		});
	});

	describe("roundtrip", () => {
		it("can save and load state", () => {
			const originalState = {
				openTabs: ["board-1", "board-2", "board-3"],
				activeTabId: "board-2",
			};

			// Use real localStorage for roundtrip test
			vi.restoreAllMocks();

			saveTabStateImmediate(originalState);
			const loadedState = loadTabState();

			expect(loadedState).toEqual(originalState);

			// Clean up
			clearTabState();
		});
	});
});
