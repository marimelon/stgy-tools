/**
 * Group feature E2E tests using Vitest Browser Mode.
 *
 * Test targets:
 * - EditKeyDialog: Edit key input and validation
 *
 * Note: Components that import server functions (CreateGroupDialog,
 * GroupHistoryDialog, GroupInfoBanner) cannot be directly tested
 * in browser tests due to TanStack Start server function limitations.
 */

import "@/lib/i18n";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { EditKeyDialog } from "@/components/viewer/EditKeyDialog";

/** Helper to find input element in the document (including portals) */
function getPasswordInput(): HTMLInputElement | null {
	return document.querySelector("input[type='password']");
}

describe("Group E2E", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		// Clean up any portals
		for (const el of document.body.querySelectorAll("[data-radix-portal]")) {
			el.remove();
		}
	});

	describe("EditKeyDialog", () => {
		/** Wrapper component to control dialog state */
		function EditKeyDialogWrapper({
			onConfirm,
		}: {
			onConfirm: (editKey: string, shouldSave: boolean) => Promise<boolean>;
		}) {
			const [open, setOpen] = useState(false);

			return (
				<>
					<button
						type="button"
						onClick={() => setOpen(true)}
						data-testid="open-dialog"
					>
						Open Dialog
					</button>
					<EditKeyDialog
						open={open}
						onOpenChange={setOpen}
						onConfirm={onConfirm}
					/>
				</>
			);
		}

		it("opens and displays correctly", async () => {
			const onConfirm = vi.fn().mockResolvedValue(true);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));

			// Dialog should be visible
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Should have password input (in portal)
			const input = getPasswordInput();
			expect(input).toBeTruthy();
		});

		it("has confirm button disabled when input is empty", async () => {
			const onConfirm = vi.fn().mockResolvedValue(true);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Confirm button should be disabled
			const confirmButton = screen.getByRole("button", {
				name: /confirm|確認/i,
			});
			await expect.element(confirmButton).toBeDisabled();
		});

		it("enables confirm button when text is entered", async () => {
			const onConfirm = vi.fn().mockResolvedValue(true);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Enter text in input
			const input = getPasswordInput() as HTMLInputElement;
			await userEvent.fill(input, "testEditKey12345");

			// Confirm button should be enabled
			const confirmButton = screen.getByRole("button", {
				name: /confirm|確認/i,
			});
			await expect.element(confirmButton).toBeEnabled();
		});

		it("calls onConfirm with entered key and closes on success", async () => {
			const onConfirm = vi.fn().mockResolvedValue(true);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Enter edit key
			const input = getPasswordInput() as HTMLInputElement;
			await userEvent.fill(input, "mySecretKey12345");

			// Click confirm
			const confirmButton = screen.getByRole("button", {
				name: /confirm|確認/i,
			});
			await userEvent.click(confirmButton);

			// Wait for async operation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// onConfirm should be called with the key (trimmed) and shouldSave (default true)
			expect(onConfirm).toHaveBeenCalledWith("mySecretKey12345", true);

			// Dialog should close on success
			await new Promise((resolve) => setTimeout(resolve, 300));
			expect(document.querySelector("[role='dialog']")).toBeFalsy();
		});

		it("shows error message when onConfirm returns false", async () => {
			const onConfirm = vi.fn().mockResolvedValue(false);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Enter edit key
			const input = getPasswordInput() as HTMLInputElement;
			await userEvent.fill(input, "wrongKey");

			// Click confirm
			const confirmButton = screen.getByRole("button", {
				name: /confirm|確認/i,
			});
			await userEvent.click(confirmButton);

			// Wait for error to appear
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Error message should be visible
			const errorMessage = document.querySelector(".text-destructive");
			expect(errorMessage).toBeTruthy();

			// Dialog should remain open
			await expect.element(screen.getByRole("dialog")).toBeVisible();
		});

		it("shows error message when onConfirm throws", async () => {
			const onConfirm = vi.fn().mockRejectedValue(new Error("Network error"));

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Enter edit key
			const input = getPasswordInput() as HTMLInputElement;
			await userEvent.fill(input, "testKey");

			// Click confirm
			const confirmButton = screen.getByRole("button", {
				name: /confirm|確認/i,
			});
			await userEvent.click(confirmButton);

			// Wait for error to appear
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Error message should be visible
			const errorMessage = document.querySelector(".text-destructive");
			expect(errorMessage).toBeTruthy();

			// Dialog should remain open
			await expect.element(screen.getByRole("dialog")).toBeVisible();
		});

		it("closes when clicking cancel button", async () => {
			const onConfirm = vi.fn().mockResolvedValue(true);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Click cancel
			const cancelButton = screen.getByRole("button", {
				name: /cancel|キャンセル/i,
			});
			await userEvent.click(cancelButton);

			// Dialog should close
			await new Promise((resolve) => setTimeout(resolve, 300));
			expect(document.querySelector("[role='dialog']")).toBeFalsy();

			// onConfirm should not be called
			expect(onConfirm).not.toHaveBeenCalled();
		});

		it("clears input and error when reopening", async () => {
			const onConfirm = vi.fn().mockResolvedValue(false);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog and trigger error
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			const input = getPasswordInput() as HTMLInputElement;
			await userEvent.fill(input, "wrongKey");

			const confirmButton = screen.getByRole("button", {
				name: /confirm|確認/i,
			});
			await userEvent.click(confirmButton);

			// Wait for error
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Close dialog
			const cancelButton = screen.getByRole("button", {
				name: /cancel|キャンセル/i,
			});
			await userEvent.click(cancelButton);
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Reopen dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Input should be empty
			const newInput = getPasswordInput() as HTMLInputElement;
			expect(newInput.value).toBe("");

			// Error should be cleared
			const errorMessage = document.querySelector(".text-destructive");
			expect(errorMessage).toBeFalsy();
		});

		it("submits on Enter key press", async () => {
			const onConfirm = vi.fn().mockResolvedValue(true);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Enter text and press Enter
			const input = getPasswordInput() as HTMLInputElement;
			await userEvent.fill(input, "myKey12345");
			await userEvent.keyboard("{Enter}");

			// Wait for async operation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// onConfirm should be called with key and shouldSave (default true)
			expect(onConfirm).toHaveBeenCalledWith("myKey12345", true);
		});

		it("does not submit on Enter when input is empty", async () => {
			const onConfirm = vi.fn().mockResolvedValue(true);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Focus input and press Enter without entering text
			const input = getPasswordInput() as HTMLInputElement;
			input.focus();
			await userEvent.keyboard("{Enter}");

			// Wait a bit
			await new Promise((resolve) => setTimeout(resolve, 100));

			// onConfirm should not be called
			expect(onConfirm).not.toHaveBeenCalled();
		});

		it("trims whitespace from input", async () => {
			const onConfirm = vi.fn().mockResolvedValue(true);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Enter text with whitespace
			const input = getPasswordInput() as HTMLInputElement;
			await userEvent.fill(input, "  myKey12345  ");

			// Click confirm
			const confirmButton = screen.getByRole("button", {
				name: /confirm|確認/i,
			});
			await userEvent.click(confirmButton);

			// Wait for async operation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// onConfirm should be called with trimmed key and shouldSave (default true)
			expect(onConfirm).toHaveBeenCalledWith("myKey12345", true);
		});

		it("shows loading state during verification", async () => {
			// Create a slow onConfirm
			const onConfirm = vi.fn().mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(true), 500);
					}),
			);

			const screen = await render(
				<EditKeyDialogWrapper onConfirm={onConfirm} />,
			);

			// Open dialog
			await userEvent.click(screen.getByTestId("open-dialog"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Enter text
			const input = getPasswordInput() as HTMLInputElement;
			await userEvent.fill(input, "testKey");

			// Click confirm
			const confirmButton = screen.getByRole("button", {
				name: /confirm|確認/i,
			});
			await userEvent.click(confirmButton);

			// Button should be disabled during loading
			await expect.element(confirmButton).toBeDisabled();

			// Wait for operation to complete
			await new Promise((resolve) => setTimeout(resolve, 600));
		});
	});
});
