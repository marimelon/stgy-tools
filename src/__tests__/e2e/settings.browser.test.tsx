/**
 * Settings機能のE2Eテスト
 *
 * テスト対象：
 * - デバッグモードの切り替え
 * - 設定の永続化（localStorage）
 * - 状態の同期
 */

import { beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
	SettingsStoreProvider,
	useDebugMode,
	useSettingsActions,
} from "@/lib/settings";

// テスト用のシンプルなコンポーネント
function DebugModeToggle() {
	const debugMode = useDebugMode();
	const { toggleDebugMode } = useSettingsActions();

	return (
		<div>
			<span data-testid="debug-status">{debugMode ? "ON" : "OFF"}</span>
			<button
				type="button"
				onClick={toggleDebugMode}
				data-testid="toggle-button"
			>
				Toggle Debug Mode
			</button>
		</div>
	);
}

function TestApp() {
	return (
		<SettingsStoreProvider>
			<DebugModeToggle />
		</SettingsStoreProvider>
	);
}

describe("Settings E2E", () => {
	beforeEach(() => {
		// localStorageをクリア
		localStorage.clear();
	});

	describe("デバッグモードの切り替え", () => {
		it("初期状態はOFF", async () => {
			const screen = await render(<TestApp />);

			await expect
				.element(screen.getByTestId("debug-status"))
				.toHaveTextContent("OFF");
		});

		it("ボタンクリックでONに切り替わる", async () => {
			const screen = await render(<TestApp />);

			await screen.getByTestId("toggle-button").click();

			await expect
				.element(screen.getByTestId("debug-status"))
				.toHaveTextContent("ON");
		});

		it("再度クリックでOFFに戻る", async () => {
			const screen = await render(<TestApp />);

			await screen.getByTestId("toggle-button").click();
			await screen.getByTestId("toggle-button").click();

			await expect
				.element(screen.getByTestId("debug-status"))
				.toHaveTextContent("OFF");
		});
	});

	describe("設定の永続化", () => {
		it("デバッグモードONがlocalStorageに保存される", async () => {
			const screen = await render(<TestApp />);

			await screen.getByTestId("toggle-button").click();

			// localStorageの値を確認
			const stored = localStorage.getItem("strategy-board-settings");
			expect(stored).not.toBeNull();

			const settings = JSON.parse(stored!);
			expect(settings.debugMode).toBe(true);
		});

		it("localStorageに保存された設定から初期化される", async () => {
			// localStorageに設定を事前に保存
			localStorage.setItem(
				"strategy-board-settings",
				JSON.stringify({ debugMode: true }),
			);

			// マウント時に保存された設定が反映されることを確認
			const screen = await render(<TestApp />);
			await expect
				.element(screen.getByTestId("debug-status"))
				.toHaveTextContent("ON");
		});
	});

	describe("複数コンポーネント間の同期", () => {
		it("複数のコンポーネントで状態が同期される", async () => {
			// 2つのDebugModeToggleを持つテストコンポーネント
			function DualToggleApp() {
				return (
					<SettingsStoreProvider>
						<div data-testid="component-1">
							<DebugModeToggle />
						</div>
						<div data-testid="component-2">
							<DebugModeToggle />
						</div>
					</SettingsStoreProvider>
				);
			}

			await render(<DualToggleApp />);

			// 最初のトグルボタンをクリック
			const buttons = page.getByTestId("toggle-button");
			await buttons.first().click();

			// 両方のコンポーネントでONになっていることを確認
			const statuses = page.getByTestId("debug-status");
			await expect.element(statuses.first()).toHaveTextContent("ON");
			await expect.element(statuses.nth(1)).toHaveTextContent("ON");
		});
	});
});
