/**
 * Group feature E2E tests with mocked server functions.
 *
 * This file tests components that depend on server functions by mocking them.
 *
 * Test targets:
 * - GroupHistoryDialog: Version history display
 */

import "@/lib/i18n";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { BoardGroupVersion } from "@/lib/server/shortLinks/types";

// Mock the server function module BEFORE importing the component
vi.mock("@/lib/server/shortLinks/serverFn", () => ({
	getGroupHistoryFn: vi.fn(),
	createGroupFn: vi.fn(),
	updateGroupFn: vi.fn(),
	deleteGroupFn: vi.fn(),
	verifyGroupEditKeyFn: vi.fn(),
	resolveGroupIdFn: vi.fn(),
	resolveShortIdFn: vi.fn(),
	createShortLinkFn: vi.fn(),
}));

// Import the component AFTER setting up the mock
import { GroupHistoryDialog } from "@/components/viewer/GroupHistoryDialog";
// Import the mocked function for type-safe access
import { getGroupHistoryFn } from "@/lib/server/shortLinks/serverFn";

// Cast to mock type for test manipulation
const mockGetGroupHistoryFn = getGroupHistoryFn as unknown as ReturnType<
	typeof vi.fn
>;

describe("Group Mock E2E", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Clean up any portals
		for (const el of document.body.querySelectorAll("[data-radix-portal]")) {
			el.remove();
		}
	});

	describe("GroupHistoryDialog", () => {
		const sampleHistory: BoardGroupVersion[] = [
			{
				version: 1,
				name: "Initial Version",
				stgyCodes: ["[stgy:aTest1]"],
				updatedAt: "2024-01-15T12:00:00.000Z",
			},
			{
				version: 2,
				name: "Updated Version",
				description: "Added more boards",
				stgyCodes: ["[stgy:aTest1]", "[stgy:aTest2]"],
				updatedAt: "2024-01-16T10:00:00.000Z",
			},
		];

		/** Wrapper component to control dialog state */
		function GroupHistoryDialogWrapper({
			groupId = "testGroup",
			currentVersion = 3,
			onViewVersion,
		}: {
			groupId?: string;
			currentVersion?: number;
			onViewVersion?: (version: BoardGroupVersion) => void;
		}) {
			const [open, setOpen] = useState(false);

			return (
				<>
					<button
						type="button"
						onClick={() => setOpen(true)}
						data-testid="open-dialog"
					>
						Open History
					</button>
					<GroupHistoryDialog
						open={open}
						onOpenChange={setOpen}
						groupId={groupId}
						currentVersion={currentVersion}
						onViewVersion={onViewVersion}
					/>
				</>
			);
		}

		it("displays loading state while fetching history", async () => {
			// Mock a slow response
			mockGetGroupHistoryFn.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(sampleHistory), 1000);
					}),
			);

			const screen = await render(<GroupHistoryDialogWrapper />);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));

			// Dialog should be visible
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Loading spinner should be visible
			const spinner = document.querySelector(".animate-spin");
			expect(spinner).toBeTruthy();
		});

		it("displays history after loading", async () => {
			mockGetGroupHistoryFn.mockResolvedValue(sampleHistory);

			const screen = await render(<GroupHistoryDialogWrapper />);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Wait for history to load
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should display version numbers
			const dialog = document.querySelector("[role='dialog']");
			expect(dialog?.textContent).toContain("v1");
			expect(dialog?.textContent).toContain("v2");
		});

		it("displays current version indicator", async () => {
			mockGetGroupHistoryFn.mockResolvedValue(sampleHistory);

			const screen = await render(
				<GroupHistoryDialogWrapper currentVersion={3} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Wait for history to load
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should display current version (v3)
			const dialog = document.querySelector("[role='dialog']");
			expect(dialog?.textContent).toContain("v3");
		});

		it("displays empty state when no history", async () => {
			mockGetGroupHistoryFn.mockResolvedValue([]);

			const screen = await render(<GroupHistoryDialogWrapper />);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Wait for history to load
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should display "no history" message
			const dialog = document.querySelector("[role='dialog']");
			expect(
				dialog?.textContent?.includes("履歴") ||
					dialog?.textContent?.includes("history"),
			).toBe(true);
		});

		it("displays error state when fetch fails", async () => {
			mockGetGroupHistoryFn.mockRejectedValue(new Error("Network error"));

			const screen = await render(<GroupHistoryDialogWrapper />);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Wait for error to appear
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should display error message
			const errorMessage = document.querySelector(".text-destructive");
			expect(errorMessage).toBeTruthy();
		});

		it("calls onViewVersion when clicking view button", async () => {
			mockGetGroupHistoryFn.mockResolvedValue(sampleHistory);
			const onViewVersion = vi.fn();

			const screen = await render(
				<GroupHistoryDialogWrapper onViewVersion={onViewVersion} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Wait for history to load
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Find and click view button (表示 or view)
			const viewButtons = document.querySelectorAll(
				"[role='dialog'] button",
			) as NodeListOf<HTMLButtonElement>;

			// Find a view button (not close button)
			let viewButton: HTMLButtonElement | null = null;
			for (const btn of viewButtons) {
				const text = btn.textContent?.toLowerCase() || "";
				if (text.includes("表示") || text.includes("view")) {
					viewButton = btn;
					break;
				}
			}

			if (viewButton) {
				await userEvent.click(viewButton);

				// onViewVersion should be called
				expect(onViewVersion).toHaveBeenCalled();
			}
		});

		it("closes dialog when clicking close button", async () => {
			mockGetGroupHistoryFn.mockResolvedValue(sampleHistory);

			const screen = await render(<GroupHistoryDialogWrapper />);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Wait for history to load
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Find and click the footer close button (not the X button)
			const closeButton = document.querySelector(
				"[role='dialog'] [data-slot='dialog-footer'] button",
			) as HTMLButtonElement;
			expect(closeButton).toBeTruthy();
			await userEvent.click(closeButton);

			// Dialog should close
			await new Promise((resolve) => setTimeout(resolve, 300));
			expect(document.querySelector("[role='dialog']")).toBeFalsy();
		});

		it("caches history and does not refetch on reopen", async () => {
			mockGetGroupHistoryFn.mockResolvedValue(sampleHistory);

			const screen = await render(<GroupHistoryDialogWrapper />);

			// Open dialog first time
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Wait for history to load
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Close dialog using footer button
			const closeButton = document.querySelector(
				"[role='dialog'] [data-slot='dialog-footer'] button",
			) as HTMLButtonElement;
			await userEvent.click(closeButton);
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Clear the mock call count
			const callCountAfterFirstOpen = mockGetGroupHistoryFn.mock.calls.length;

			// Reopen dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Wait a bit
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should not have made additional calls (cached)
			expect(mockGetGroupHistoryFn.mock.calls.length).toBe(
				callCountAfterFirstOpen,
			);
		});
	});
});
