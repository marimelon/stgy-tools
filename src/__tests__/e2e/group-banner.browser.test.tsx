/**
 * GroupInfoBanner E2E tests using Vitest Browser Mode.
 *
 * Test targets:
 * - Normal view mode: display, copy buttons, edit button, history button
 * - Edit mode: inline editing, save/cancel, delete button, validation
 * - Past version mode: display, back to current button
 */

import "@/lib/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { GroupInfoBanner } from "@/components/viewer/GroupInfoBanner";

describe("GroupInfoBanner E2E", () => {
	const defaultProps = {
		name: "Test Group",
		description: "Test description",
		boardCount: 3,
		groupUrl: "https://example.com/g/abc123",
		stgyCodes: ["[stgy:aTest1]", "[stgy:aTest2]"],
		version: 2,
		isEditMode: false,
		isUpdating: false,
		editedName: "Test Group",
		editedDescription: "Test description",
		onEditedNameChange: vi.fn(),
		onEditedDescriptionChange: vi.fn(),
		onEditClick: vi.fn(),
		onCancelEdit: vi.fn(),
		onSaveEdit: vi.fn(),
		onDeleteClick: vi.fn(),
		onHistoryClick: vi.fn(),
	};

	// Store original clipboard for restoration
	let originalClipboard: Clipboard;

	beforeEach(() => {
		vi.clearAllMocks();
		originalClipboard = navigator.clipboard;
	});

	afterEach(() => {
		// Restore clipboard
		Object.defineProperty(navigator, "clipboard", {
			value: originalClipboard,
			writable: true,
			configurable: true,
		});
	});

	/** Helper to mock clipboard */
	function mockClipboard(writeTextFn: (text: string) => Promise<void>) {
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: writeTextFn },
			writable: true,
			configurable: true,
		});
	}

	describe("Normal View Mode", () => {
		it("displays group name and description", async () => {
			const screen = await render(<GroupInfoBanner {...defaultProps} />);

			await expect.element(screen.getByText("Test Group")).toBeVisible();
			await expect.element(screen.getByText("Test description")).toBeVisible();
		});

		it("displays board count badge", async () => {
			const screen = await render(<GroupInfoBanner {...defaultProps} />);

			// Should show board count (in Japanese or English)
			const container = screen.container;
			const text = container.textContent;
			expect(text?.includes("3") || text?.includes("ボード")).toBe(true);
		});

		it("displays version badge", async () => {
			const screen = await render(<GroupInfoBanner {...defaultProps} />);

			await expect.element(screen.getByText("v2")).toBeVisible();
		});

		it("calls onHistoryClick when clicking version badge", async () => {
			const onHistoryClick = vi.fn();
			const screen = await render(
				<GroupInfoBanner {...defaultProps} onHistoryClick={onHistoryClick} />,
			);

			await userEvent.click(screen.getByText("v2"));

			expect(onHistoryClick).toHaveBeenCalled();
		});

		it("calls onEditClick when clicking edit button", async () => {
			const onEditClick = vi.fn();
			const screen = await render(
				<GroupInfoBanner {...defaultProps} onEditClick={onEditClick} />,
			);

			// Find and click edit button (pencil icon button)
			const buttons = screen.container.querySelectorAll("button");
			const editButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-pencil") ||
					btn.title?.includes("編集") ||
					btn.title?.includes("edit"),
			);
			expect(editButton).toBeTruthy();
			await userEvent.click(editButton!);

			expect(onEditClick).toHaveBeenCalled();
		});

		it("copies URL when clicking copy URL button", async () => {
			let copiedText: string | null = null;
			mockClipboard(async (text) => {
				copiedText = text;
			});

			const screen = await render(<GroupInfoBanner {...defaultProps} />);

			// Find and click copy URL button (link icon button)
			const buttons = screen.container.querySelectorAll("button");
			const copyUrlButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-link") ||
					btn.title?.includes("URL") ||
					btn.title?.includes("url"),
			);
			expect(copyUrlButton).toBeTruthy();
			await userEvent.click(copyUrlButton!);

			expect(copiedText).toBe("https://example.com/g/abc123");
		});

		it("copies stgy codes when clicking copy codes button", async () => {
			let copiedText: string | null = null;
			mockClipboard(async (text) => {
				copiedText = text;
			});

			const screen = await render(<GroupInfoBanner {...defaultProps} />);

			// Find and click copy codes button (clipboard icon button)
			const buttons = screen.container.querySelectorAll("button");
			const copyCodesButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-clipboard-copy") ||
					btn.title?.includes("コード") ||
					btn.title?.includes("code"),
			);
			expect(copyCodesButton).toBeTruthy();
			await userEvent.click(copyCodesButton!);

			expect(copiedText).toBe("[stgy:aTest1]\n[stgy:aTest2]");
		});

		it("shows check icon after successful copy", async () => {
			mockClipboard(async () => {});

			const screen = await render(<GroupInfoBanner {...defaultProps} />);

			// Find and click copy URL button
			const buttons = screen.container.querySelectorAll("button");
			const copyUrlButton = Array.from(buttons).find((btn) =>
				btn.querySelector("svg.lucide-link"),
			);
			await userEvent.click(copyUrlButton!);

			// Wait for state update
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should show check icon
			const checkIcon = screen.container.querySelector("svg.lucide-check");
			expect(checkIcon).toBeTruthy();
		});

		it("does not show copy buttons when no URL or codes", async () => {
			const screen = await render(
				<GroupInfoBanner
					{...defaultProps}
					groupUrl={undefined}
					stgyCodes={undefined}
				/>,
			);

			const buttons = screen.container.querySelectorAll("button");
			const copyUrlButton = Array.from(buttons).find((btn) =>
				btn.querySelector("svg.lucide-link"),
			);
			const copyCodesButton = Array.from(buttons).find((btn) =>
				btn.querySelector("svg.lucide-clipboard-copy"),
			);

			expect(copyUrlButton).toBeFalsy();
			expect(copyCodesButton).toBeFalsy();
		});

		it("does not show version badge when no version", async () => {
			const screen = await render(
				<GroupInfoBanner {...defaultProps} version={undefined} />,
			);

			const versionBadge = screen.container.querySelector(
				"button:has(svg.lucide-history)",
			);
			expect(versionBadge).toBeFalsy();
		});
	});

	describe("Edit Mode", () => {
		const editModeProps = {
			...defaultProps,
			isEditMode: true,
		};

		it("displays name input field", async () => {
			const screen = await render(<GroupInfoBanner {...editModeProps} />);

			const nameInput = screen.container.querySelector(
				"input",
			) as HTMLInputElement;
			expect(nameInput).toBeTruthy();
			expect(nameInput.value).toBe("Test Group");
		});

		it("displays description textarea", async () => {
			const screen = await render(<GroupInfoBanner {...editModeProps} />);

			const textarea = screen.container.querySelector(
				"textarea",
			) as HTMLTextAreaElement;
			expect(textarea).toBeTruthy();
			expect(textarea.value).toBe("Test description");
		});

		it("calls onEditedNameChange when typing in name input", async () => {
			const onEditedNameChange = vi.fn();
			const screen = await render(
				<GroupInfoBanner
					{...editModeProps}
					onEditedNameChange={onEditedNameChange}
				/>,
			);

			const nameInput = screen.container.querySelector(
				"input",
			) as HTMLInputElement;
			await userEvent.clear(nameInput);
			await userEvent.type(nameInput, "New Name");

			expect(onEditedNameChange).toHaveBeenCalled();
		});

		it("calls onEditedDescriptionChange when typing in description", async () => {
			const onEditedDescriptionChange = vi.fn();
			const screen = await render(
				<GroupInfoBanner
					{...editModeProps}
					onEditedDescriptionChange={onEditedDescriptionChange}
				/>,
			);

			const textarea = screen.container.querySelector(
				"textarea",
			) as HTMLTextAreaElement;
			await userEvent.clear(textarea);
			await userEvent.type(textarea, "New description");

			expect(onEditedDescriptionChange).toHaveBeenCalled();
		});

		it("calls onSaveEdit when clicking save button", async () => {
			const onSaveEdit = vi.fn();
			const screen = await render(
				<GroupInfoBanner {...editModeProps} onSaveEdit={onSaveEdit} />,
			);

			// Find save button (has check icon or contains 更新/update text)
			const buttons = screen.container.querySelectorAll("button");
			const saveButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-check") ||
					btn.textContent?.includes("更新") ||
					btn.textContent?.includes("Update"),
			);
			expect(saveButton).toBeTruthy();
			await userEvent.click(saveButton!);

			expect(onSaveEdit).toHaveBeenCalled();
		});

		it("calls onCancelEdit when clicking cancel button", async () => {
			const onCancelEdit = vi.fn();
			const screen = await render(
				<GroupInfoBanner {...editModeProps} onCancelEdit={onCancelEdit} />,
			);

			// Find cancel button (has X icon or contains キャンセル/cancel text)
			const buttons = screen.container.querySelectorAll("button");
			const cancelButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-x") ||
					btn.textContent?.includes("キャンセル") ||
					btn.textContent?.includes("Cancel"),
			);
			expect(cancelButton).toBeTruthy();
			await userEvent.click(cancelButton!);

			expect(onCancelEdit).toHaveBeenCalled();
		});

		it("calls onDeleteClick when clicking delete button", async () => {
			const onDeleteClick = vi.fn();
			const screen = await render(
				<GroupInfoBanner {...editModeProps} onDeleteClick={onDeleteClick} />,
			);

			// Find delete button (has trash icon)
			const buttons = screen.container.querySelectorAll("button");
			const deleteButton = Array.from(buttons).find((btn) =>
				btn.querySelector("svg.lucide-trash-2"),
			);
			expect(deleteButton).toBeTruthy();
			await userEvent.click(deleteButton!);

			expect(onDeleteClick).toHaveBeenCalled();
		});

		it("disables save button when name is empty", async () => {
			const screen = await render(
				<GroupInfoBanner {...editModeProps} editedName="" />,
			);

			const buttons = screen.container.querySelectorAll("button");
			const saveButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-check") ||
					btn.textContent?.includes("更新") ||
					btn.textContent?.includes("Update"),
			) as HTMLButtonElement;

			expect(saveButton?.disabled).toBe(true);
		});

		it("disables save button when hasValidStgyCodes is false", async () => {
			const screen = await render(
				<GroupInfoBanner {...editModeProps} hasValidStgyCodes={false} />,
			);

			const buttons = screen.container.querySelectorAll("button");
			const saveButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-check") ||
					btn.textContent?.includes("更新") ||
					btn.textContent?.includes("Update"),
			) as HTMLButtonElement;

			expect(saveButton?.disabled).toBe(true);
		});

		it("disables all inputs and buttons when isUpdating is true", async () => {
			const screen = await render(
				<GroupInfoBanner {...editModeProps} isUpdating={true} />,
			);

			const nameInput = screen.container.querySelector(
				"input",
			) as HTMLInputElement;
			const textarea = screen.container.querySelector(
				"textarea",
			) as HTMLTextAreaElement;

			expect(nameInput.disabled).toBe(true);
			expect(textarea.disabled).toBe(true);

			// Cancel and delete buttons should be disabled
			const buttons = screen.container.querySelectorAll("button");
			const cancelButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-x") ||
					btn.textContent?.includes("キャンセル"),
			) as HTMLButtonElement;
			const deleteButton = Array.from(buttons).find((btn) =>
				btn.querySelector("svg.lucide-trash-2"),
			) as HTMLButtonElement;

			expect(cancelButton?.disabled).toBe(true);
			expect(deleteButton?.disabled).toBe(true);
		});

		it("shows loading spinner when isUpdating is true", async () => {
			const screen = await render(
				<GroupInfoBanner {...editModeProps} isUpdating={true} />,
			);

			// Look for animate-spin class on any SVG element
			const spinner = screen.container.querySelector("svg.animate-spin");
			expect(spinner).toBeTruthy();
		});

		it("displays error message when updateError is set", async () => {
			const screen = await render(
				<GroupInfoBanner
					{...editModeProps}
					updateError="Failed to update group"
				/>,
			);

			await expect
				.element(screen.getByText("Failed to update group"))
				.toBeVisible();
		});

		it("displays version badge in edit mode", async () => {
			const screen = await render(<GroupInfoBanner {...editModeProps} />);

			await expect.element(screen.getByText("v2")).toBeVisible();
		});
	});

	describe("Past Version Mode", () => {
		const pastVersionProps = {
			...defaultProps,
			isPastVersion: true,
			version: 1,
			currentVersion: 3,
			onBackToCurrentVersion: vi.fn(),
		};

		it("displays past version indicator", async () => {
			const screen = await render(<GroupInfoBanner {...pastVersionProps} />);

			// Should show v1 badge
			await expect.element(screen.getByText(/v1/)).toBeVisible();
		});

		it("displays current version info", async () => {
			const screen = await render(<GroupInfoBanner {...pastVersionProps} />);

			// Should show reference to current version (v3)
			const container = screen.container;
			expect(container.textContent?.includes("v3")).toBe(true);
		});

		it("shows back to current button", async () => {
			const screen = await render(<GroupInfoBanner {...pastVersionProps} />);

			// Find button with arrow-left icon or "現在" text
			const buttons = screen.container.querySelectorAll("button");
			const backButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-arrow-left") ||
					btn.textContent?.includes("現在") ||
					btn.textContent?.includes("current"),
			);
			expect(backButton).toBeTruthy();
		});

		it("calls onBackToCurrentVersion when clicking back button", async () => {
			const onBackToCurrentVersion = vi.fn();
			const screen = await render(
				<GroupInfoBanner
					{...pastVersionProps}
					onBackToCurrentVersion={onBackToCurrentVersion}
				/>,
			);

			const buttons = screen.container.querySelectorAll("button");
			const backButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-arrow-left") ||
					btn.textContent?.includes("現在") ||
					btn.textContent?.includes("current"),
			);
			await userEvent.click(backButton!);

			expect(onBackToCurrentVersion).toHaveBeenCalled();
		});

		it("does not show edit button in past version mode", async () => {
			const screen = await render(<GroupInfoBanner {...pastVersionProps} />);

			const buttons = screen.container.querySelectorAll("button");
			const editButton = Array.from(buttons).find((btn) =>
				btn.querySelector("svg.lucide-pencil"),
			);
			expect(editButton).toBeFalsy();
		});

		it("displays description in past version mode", async () => {
			const screen = await render(<GroupInfoBanner {...pastVersionProps} />);

			await expect.element(screen.getByText("Test description")).toBeVisible();
		});

		it("has amber border for past version", async () => {
			const screen = await render(<GroupInfoBanner {...pastVersionProps} />);

			const banner = screen.container.querySelector("div");
			expect(banner?.className.includes("amber")).toBe(true);
		});
	});

	describe("Edge Cases", () => {
		it("handles clipboard write failure gracefully", async () => {
			// Mock clipboard to fail
			mockClipboard(async () => {
				throw new Error("Copy failed");
			});

			const screen = await render(<GroupInfoBanner {...defaultProps} />);

			const buttons = screen.container.querySelectorAll("button");
			const copyUrlButton = Array.from(buttons).find((btn) =>
				btn.querySelector("svg.lucide-link"),
			);
			await userEvent.click(copyUrlButton!);

			// Wait for state update
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should show X icon for error
			const errorIcon = screen.container.querySelector("svg.lucide-x");
			expect(errorIcon).toBeTruthy();
		});

		it("renders without description", async () => {
			const screen = await render(
				<GroupInfoBanner {...defaultProps} description={undefined} />,
			);

			await expect.element(screen.getByText("Test Group")).toBeVisible();
			// Should not crash
		});

		it("handles empty stgyCodes array", async () => {
			const screen = await render(
				<GroupInfoBanner {...defaultProps} stgyCodes={[]} />,
			);

			const buttons = screen.container.querySelectorAll("button");
			const copyCodesButton = Array.from(buttons).find((btn) =>
				btn.querySelector("svg.lucide-clipboard-copy"),
			);
			expect(copyCodesButton).toBeFalsy();
		});

		it("trims whitespace from editedName for save button validation", async () => {
			const screen = await render(
				<GroupInfoBanner
					{...defaultProps}
					isEditMode={true}
					editedName="   "
				/>,
			);

			const buttons = screen.container.querySelectorAll("button");
			const saveButton = Array.from(buttons).find(
				(btn) =>
					btn.querySelector("svg.lucide-check") ||
					btn.textContent?.includes("更新"),
			) as HTMLButtonElement;

			// Should be disabled because trimmed name is empty
			expect(saveButton?.disabled).toBe(true);
		});
	});
});
