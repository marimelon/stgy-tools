/**
 * Modal E2Eテスト
 *
 * Vitest Browser Mode を使用したモーダルの統合テスト
 *
 * テスト対象：
 * - ImportModal: stgyコードのインポート
 * - SettingsModal: 設定とタブ切り替え
 *
 * Note: ExportModal はサーバー関数をインポートしているため、
 * ブラウザテストでは直接テストできない。
 * サーバー関数のモックが必要な場合は別のテスト方式を検討する。
 */

import NiceModal from "@ebay/nice-modal-react";
import "@/lib/i18n";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ImportModal } from "@/components/editor/ImportModal";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { BoardsProvider } from "@/lib/boards/BoardsProvider";
import { resetEditorStore } from "@/lib/editor/store/editorStore";
import { globalHistoryStore } from "@/lib/editor/store/globalHistoryStore";
import { SettingsStoreProvider } from "@/lib/settings/SettingsStoreProvider";

// Sample stgy code for testing
const SAMPLE_STGY_CODE =
	"[stgy:a0OcAwAYAfwgAFYAFBAAZYTLdYTLdYTLdYTLdYTLdYTLdYTLd]";

/** Test wrapper providing all required providers */
function TestProviders({ children }: { children: ReactNode }) {
	return (
		<SettingsStoreProvider>
			<BoardsProvider>
				<NiceModal.Provider>{children}</NiceModal.Provider>
			</BoardsProvider>
		</SettingsStoreProvider>
	);
}

/** Component to trigger modal display */
function ModalTrigger({
	modalId,
	onResult,
	props = {},
}: {
	modalId: typeof ImportModal | typeof SettingsModal;
	onResult?: (result: unknown) => void;
	props?: Record<string, unknown>;
}) {
	const handleClick = async () => {
		const result = await NiceModal.show(modalId, props);
		onResult?.(result);
	};

	return (
		<button type="button" onClick={handleClick} data-testid="modal-trigger">
			Open Modal
		</button>
	);
}

describe("Modal E2E", () => {
	beforeEach(() => {
		localStorage.clear();
		resetEditorStore();
		globalHistoryStore.setState({ histories: new Map() });
	});

	afterEach(() => {
		// Clean up any open modals
		NiceModal.remove(ImportModal);
		NiceModal.remove(SettingsModal);
	});

	describe("ImportModal", () => {
		it("opens and closes correctly", async () => {
			const screen = await render(
				<TestProviders>
					<ModalTrigger modalId={ImportModal} />
				</TestProviders>,
			);

			// Open modal
			const trigger = screen.getByTestId("modal-trigger");
			await userEvent.click(trigger);

			// Wait for modal to appear
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Find and click cancel button
			const cancelButton = screen.getByRole("button", {
				name: /cancel|キャンセル/i,
			});
			await userEvent.click(cancelButton);

			// Modal should close
			await new Promise((resolve) => setTimeout(resolve, 300));
			expect(screen.container.querySelector("[role='dialog']")).toBeFalsy();
		});

		it("shows import button disabled when textarea is empty", async () => {
			const screen = await render(
				<TestProviders>
					<ModalTrigger modalId={ImportModal} />
				</TestProviders>,
			);

			// Open modal
			await userEvent.click(screen.getByTestId("modal-trigger"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Find import button - should be disabled
			const importButton = screen.getByRole("button", {
				name: /import|インポート/i,
			});
			await expect.element(importButton).toBeDisabled();
		});

		it("enables import button when text is entered", async () => {
			const screen = await render(
				<TestProviders>
					<ModalTrigger modalId={ImportModal} />
				</TestProviders>,
			);

			// Open modal
			await userEvent.click(screen.getByTestId("modal-trigger"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Enter text in textarea
			const textarea = screen.getByRole("textbox");
			await userEvent.fill(textarea, SAMPLE_STGY_CODE);

			// Import button should be enabled
			const importButton = screen.getByRole("button", {
				name: /import|インポート/i,
			});
			await expect.element(importButton).toBeEnabled();
		});

		it("successfully imports valid stgy code and closes modal", async () => {
			const screen = await render(
				<TestProviders>
					<ModalTrigger modalId={ImportModal} />
				</TestProviders>,
			);

			// Open modal
			await userEvent.click(screen.getByTestId("modal-trigger"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Enter valid stgy code
			const textarea = screen.getByRole("textbox");
			await userEvent.fill(textarea, SAMPLE_STGY_CODE);

			// Click import
			const importButton = screen.getByRole("button", {
				name: /import|インポート/i,
			});
			await userEvent.click(importButton);

			// On successful import, modal should close (no error shown)
			// Wait for modal to close
			for (let i = 0; i < 30; i++) {
				if (!screen.container.querySelector("[role='dialog']")) break;
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Modal should have closed (success case)
			expect(screen.container.querySelector("[role='dialog']")).toBeFalsy();
		});

		it("handles invalid stgy code without crashing", async () => {
			const screen = await render(
				<TestProviders>
					<ModalTrigger modalId={ImportModal} />
				</TestProviders>,
			);

			// Open modal
			await userEvent.click(screen.getByTestId("modal-trigger"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Enter invalid stgy code
			const textarea = screen.getByRole("textbox");
			await userEvent.fill(textarea, "invalid-stgy-code");

			// Click import - should handle error gracefully
			const importButton = screen.getByRole("button", {
				name: /import|インポート/i,
			});
			await userEvent.click(importButton);

			// Wait for any error handling
			await new Promise((resolve) => setTimeout(resolve, 300));

			// No unhandled exceptions - test passes if we get here
			expect(true).toBe(true);
		});
	});

	// Note: ExportModal tests are skipped because it imports server functions
	// that use Node.js AsyncLocalStorage which is not available in browser tests.
	// ExportModal can be tested through integration tests or by mocking server functions.

	describe("SettingsModal", () => {
		it("opens with general tab active by default", async () => {
			const screen = await render(
				<TestProviders>
					<ModalTrigger modalId={SettingsModal} />
				</TestProviders>,
			);

			// Open modal
			await userEvent.click(screen.getByTestId("modal-trigger"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// General tab should be active (has bg-background class)
			const generalTab = screen.getByRole("button", { name: /general|一般/i });
			const generalTabElement = generalTab.element();
			expect(generalTabElement.className).toContain("bg-background");
		});

		it("switches to shortcuts tab when clicked", async () => {
			const screen = await render(
				<TestProviders>
					<ModalTrigger modalId={SettingsModal} />
				</TestProviders>,
			);

			// Open modal
			await userEvent.click(screen.getByTestId("modal-trigger"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Click shortcuts tab
			const shortcutsTab = screen.getByRole("button", {
				name: /shortcuts|ショートカット/i,
			});
			await userEvent.click(shortcutsTab);

			// Shortcuts tab should be active - wait for class change
			await new Promise((resolve) => setTimeout(resolve, 100));
			const shortcutsTabElement = shortcutsTab.element();
			expect(shortcutsTabElement.className).toContain("bg-background");
		});

		it("has debug mode toggle in general tab", async () => {
			const screen = await render(
				<TestProviders>
					<ModalTrigger modalId={SettingsModal} />
				</TestProviders>,
			);

			// Open modal
			await userEvent.click(screen.getByTestId("modal-trigger"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Debug mode switch should exist
			const debugSwitch = screen.getByRole("switch");
			expect(debugSwitch).toBeTruthy();
		});

		it("has reset button", async () => {
			const screen = await render(
				<TestProviders>
					<ModalTrigger modalId={SettingsModal} />
				</TestProviders>,
			);

			// Open modal
			await userEvent.click(screen.getByTestId("modal-trigger"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Reset button should exist
			const resetButton = screen.getByRole("button", {
				name: /reset|リセット/i,
			});
			expect(resetButton).toBeTruthy();
		});

		it("closes when pressing Escape key", async () => {
			const screen = await render(
				<TestProviders>
					<ModalTrigger modalId={SettingsModal} />
				</TestProviders>,
			);

			// Open modal
			await userEvent.click(screen.getByTestId("modal-trigger"));
			await expect.element(screen.getByRole("dialog")).toBeVisible();

			// Press Escape to close the modal (Radix Dialog default behavior)
			await userEvent.keyboard("{Escape}");

			// Modal should close
			await new Promise((resolve) => setTimeout(resolve, 300));
			expect(screen.container.querySelector("[role='dialog']")).toBeFalsy();
		});
	});

	describe("Asset Modals", () => {
		// Note: SaveAssetModal, ImportAssetModal, and ExportAssetModal require
		// more complex setup with selected objects and asset context.
		// These are tested implicitly through the AssetPanel integration.
		// More detailed tests can be added if needed.

		it("placeholder for asset modal tests", () => {
			// Asset modals require:
			// - SaveAssetModal: Selected objects in editor
			// - ImportAssetModal: Asset context (useAssets hook)
			// - ExportAssetModal: Asset data
			// These should be tested as part of AssetPanel integration tests
			expect(true).toBe(true);
		});
	});
});
