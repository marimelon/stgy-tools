/**
 * Editor E2Eテスト
 *
 * Vitest Browser Mode を使用したエディターの統合テスト
 *
 * テスト対象：
 * - エディターボードの初期化とレンダリング
 * - オブジェクトの追加・選択
 * - Undo/Redo機能
 */

import "@/lib/i18n";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { EditorBoard } from "@/components/editor/EditorBoard";
import {
	createDefaultObject,
	createEmptyBoard,
	DEFAULT_OVERLAY_SETTINGS,
	EditorStoreProvider,
	type GridSettings,
	useEditorActions,
	useEditorSelector,
} from "@/lib/editor";
import { ObjectIds } from "@/lib/stgy";

/** デフォルトのグリッド設定 */
const DEFAULT_GRID_SETTINGS: GridSettings = {
	enabled: false,
	size: 16,
	showGrid: false,
	overlayType: "none",
	showBackground: true,
	canvasColor: "slate-800",
	overlaySettings: DEFAULT_OVERLAY_SETTINGS,
};

/** テスト用EditorBoardラッパー */
function TestEditorBoard() {
	return (
		<EditorStoreProvider
			initialBoard={createEmptyBoard("Test Board")}
			initialGroups={[]}
			initialGridSettings={DEFAULT_GRID_SETTINGS}
			boardId={null}
		>
			<EditorBoard scale={1} />
		</EditorStoreProvider>
	);
}

/** オブジェクト追加とレンダリング確認用のテストコンポーネント */
function EditorWithObject({ objectId }: { objectId: number }) {
	const board = createEmptyBoard("Test Board");
	const obj = createDefaultObject(objectId);
	board.objects.push(obj);

	return (
		<EditorStoreProvider
			initialBoard={board}
			initialGroups={[]}
			initialGridSettings={DEFAULT_GRID_SETTINGS}
			boardId={null}
		>
			<EditorBoard scale={1} />
		</EditorStoreProvider>
	);
}

describe("Editor E2E", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe("エディターボードのレンダリング", () => {
		it("空のボードが正しくレンダリングされる", async () => {
			const screen = await render(<TestEditorBoard />);

			// SVG要素が存在することを確認
			const svg = screen.container.querySelector("svg");
			expect(svg).toBeTruthy();

			// aria-labelが正しく設定されていることを確認
			await expect
				.element(screen.getByRole("application"))
				.toHaveAttribute("aria-label", "Strategy Board Editor");
		});

		it("SVGのviewBoxが正しく設定されている", async () => {
			const screen = await render(<TestEditorBoard />);

			const svg = screen.container.querySelector("svg");
			expect(svg?.getAttribute("viewBox")).toBe("0 0 512 384");
		});

		it("scale=2でサイズが2倍になる", async () => {
			const screen = await render(
				<EditorStoreProvider
					initialBoard={createEmptyBoard("Test Board")}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<EditorBoard scale={2} />
				</EditorStoreProvider>,
			);

			const svg = screen.container.querySelector("svg");
			expect(svg?.getAttribute("width")).toBe("1024");
			expect(svg?.getAttribute("height")).toBe("768");
		});
	});

	describe("オブジェクトのレンダリング", () => {
		it("CircleAoEオブジェクトがレンダリングされる", async () => {
			const screen = await render(
				<EditorWithObject objectId={ObjectIds.CircleAoE} />,
			);

			// オブジェクトはg要素でラップされてレンダリングされる
			const objectGroups = screen.container.querySelectorAll("svg > g");
			expect(objectGroups.length).toBeGreaterThan(0);

			// CircleAoEは circle または image（オリジナル画像モード）としてレンダリングされる
			const circles = screen.container.querySelectorAll("circle");
			const images = screen.container.querySelectorAll("image");
			expect(circles.length + images.length).toBeGreaterThan(0);
		});

		it("LineAoEオブジェクトがレンダリングされる", async () => {
			const screen = await render(
				<EditorWithObject objectId={ObjectIds.LineAoE} />,
			);

			// LineAoEは rect としてレンダリングされる
			const objectGroups = screen.container.querySelectorAll("svg > g");
			expect(objectGroups.length).toBeGreaterThan(0);
		});

		it("Lineオブジェクトがレンダリングされる", async () => {
			const screen = await render(
				<EditorWithObject objectId={ObjectIds.Line} />,
			);

			// line要素が存在することを確認
			const lines = screen.container.querySelectorAll("line");
			expect(lines.length).toBeGreaterThan(0);
		});
	});

	describe("オブジェクトの選択", () => {
		it("オブジェクトをクリックすると選択状態になる", async () => {
			const board = createEmptyBoard("Test Board");
			const obj = createDefaultObject(ObjectIds.CircleAoE, { x: 100, y: 100 });
			board.objects.push(obj);

			let selectedIds: string[] = [];

			function TestComponent() {
				const ids = useEditorSelector((s) => s.selectedIds);
				selectedIds = ids;
				return <EditorBoard scale={1} />;
			}

			const screen = await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// 初期状態：選択なし
			expect(selectedIds).toHaveLength(0);

			// オブジェクトをクリック（g要素内の最初のオブジェクト）
			const objectGroup = screen.container.querySelector("svg > g");
			expect(objectGroup).toBeTruthy();
			await userEvent.click(objectGroup!);

			// 選択状態を確認（再レンダリング後）
			expect(selectedIds).toHaveLength(1);
			expect(selectedIds[0]).toBe(obj.id);
		});

		it("deselectAllアクションで選択が解除される", async () => {
			const board = createEmptyBoard("Test Board");
			const obj = createDefaultObject(ObjectIds.CircleAoE, { x: 100, y: 100 });
			board.objects.push(obj);

			let selectedIds: string[] = [];
			const actionsRef: { deselectAll: (() => void) | null } = {
				deselectAll: null,
			};

			function TestComponent() {
				const ids = useEditorSelector((s) => s.selectedIds);
				const { selectObject, deselectAll } = useEditorActions();
				const [initialized, setInitialized] = useState(false);

				selectedIds = ids;
				actionsRef.deselectAll = deselectAll;

				// 初回のみオブジェクトを選択
				useEffect(() => {
					if (!initialized) {
						selectObject(obj.id);
						setInitialized(true);
					}
				}, [initialized, selectObject]);

				return <EditorBoard scale={1} />;
			}

			await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// 選択状態を確認（useEffectが実行されるのを待つ）
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(selectedIds).toHaveLength(1);

			// deselectAllを呼び出し
			actionsRef.deselectAll?.();

			// 選択解除を確認
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(selectedIds).toHaveLength(0);
		});
	});

	describe("選択ハンドルの表示", () => {
		it("単一オブジェクト選択時に選択ハンドルが表示される", async () => {
			const board = createEmptyBoard("Test Board");
			const obj = createDefaultObject(ObjectIds.CircleAoE, { x: 200, y: 200 });
			board.objects.push(obj);

			const screen = await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<EditorBoard scale={1} />
				</EditorStoreProvider>,
			);

			// オブジェクトをクリックして選択
			const objectGroup = screen.container.querySelector("svg > g");
			expect(objectGroup).toBeTruthy();
			await userEvent.click(objectGroup!);

			// 選択ハンドル（回転ハンドル=circle r=4、リサイズハンドル=rect width=8）が表示されるのを待つ
			// ポーリングで確認
			let rotateHandle: Element | undefined;
			let resizeHandles: Element[] = [];

			for (let i = 0; i < 20; i++) {
				const circles = screen.container.querySelectorAll("svg circle");
				rotateHandle = Array.from(circles).find(
					(c) => c.getAttribute("r") === "4",
				);

				const rects = screen.container.querySelectorAll("svg rect");
				resizeHandles = Array.from(rects).filter(
					(r) => r.getAttribute("width") === "8",
				);

				if (rotateHandle && resizeHandles.length === 4) {
					break;
				}
				await new Promise((resolve) => setTimeout(resolve, 10));
			}

			expect(rotateHandle).toBeTruthy();
			expect(resizeHandles.length).toBe(4);
		});
	});
});
