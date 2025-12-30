/**
 * SelectionHandles コンポーネントのテスト
 *
 * ハンドル操作時のclickイベント伝播を検証
 */

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectionHandles } from "../SelectionHandles";

describe("SelectionHandles", () => {
	describe("clickイベント伝播の防止", () => {
		it("回転ハンドル（circle）をクリックしてもイベントが伝播しない", () => {
			const onRotateStart = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<SelectionHandles
						x={100}
						y={100}
						width={50}
						height={50}
						rotation={0}
						onRotateStart={onRotateStart}
					/>
				</svg>,
			);

			// 回転ハンドル（circle）を取得
			const rotateHandle = container.querySelector("circle");
			expect(rotateHandle).toBeTruthy();

			// クリックイベント
			fireEvent.click(rotateHandle!);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("リサイズハンドル（rect）をクリックしてもイベントが伝播しない", () => {
			const onResizeStart = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<SelectionHandles
						x={100}
						y={100}
						width={50}
						height={50}
						rotation={0}
						onResizeStart={onResizeStart}
					/>
				</svg>,
			);

			// リサイズハンドル（rect、width=8のもの）を取得
			const resizeHandles = container.querySelectorAll("rect");
			const resizeHandle = Array.from(resizeHandles).find(
				(rect) => rect.getAttribute("width") === "8",
			);
			expect(resizeHandle).toBeTruthy();

			// クリックイベント
			fireEvent.click(resizeHandle!);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("回転ハンドルのドラッグ後のクリックイベントも伝播しない", () => {
			const onRotateStart = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<SelectionHandles
						x={100}
						y={100}
						width={50}
						height={50}
						rotation={0}
						onRotateStart={onRotateStart}
					/>
				</svg>,
			);

			const rotateHandle = container.querySelector("circle")!;

			// ドラッグシーケンス（PointerDown → PointerUp → Click）
			fireEvent.pointerDown(rotateHandle);
			fireEvent.pointerUp(rotateHandle);
			fireEvent.click(rotateHandle);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("リサイズハンドルのドラッグ後のクリックイベントも伝播しない", () => {
			const onResizeStart = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<SelectionHandles
						x={100}
						y={100}
						width={50}
						height={50}
						rotation={0}
						onResizeStart={onResizeStart}
					/>
				</svg>,
			);

			const resizeHandles = container.querySelectorAll("rect");
			const resizeHandle = Array.from(resizeHandles).find(
				(rect) => rect.getAttribute("width") === "8",
			)!;

			// ドラッグシーケンス（PointerDown → PointerUp → Click）
			fireEvent.pointerDown(resizeHandle);
			fireEvent.pointerUp(resizeHandle);
			fireEvent.click(resizeHandle);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});
	});

	describe("コールバックの動作", () => {
		it("回転ハンドルのPointerDownでonRotateStartが呼ばれる", () => {
			const onRotateStart = vi.fn();

			const { container } = render(
				<svg>
					<SelectionHandles
						x={100}
						y={100}
						width={50}
						height={50}
						rotation={0}
						onRotateStart={onRotateStart}
					/>
				</svg>,
			);

			const rotateHandle = container.querySelector("circle")!;
			fireEvent.pointerDown(rotateHandle);

			expect(onRotateStart).toHaveBeenCalledTimes(1);
		});

		it("リサイズハンドルのPointerDownでonResizeStartが呼ばれる", () => {
			const onResizeStart = vi.fn();

			const { container } = render(
				<svg>
					<SelectionHandles
						x={100}
						y={100}
						width={50}
						height={50}
						rotation={0}
						onResizeStart={onResizeStart}
					/>
				</svg>,
			);

			const resizeHandles = container.querySelectorAll("rect");
			const resizeHandle = Array.from(resizeHandles).find(
				(rect) => rect.getAttribute("width") === "8",
			)!;
			fireEvent.pointerDown(resizeHandle);

			expect(onResizeStart).toHaveBeenCalledTimes(1);
		});
	});

	describe("レンダリング", () => {
		it("4つのリサイズハンドルが正しくレンダリングされる", () => {
			const { container } = render(
				<svg>
					<SelectionHandles
						x={100}
						y={100}
						width={50}
						height={50}
						rotation={0}
					/>
				</svg>,
			);

			const resizeHandles = container.querySelectorAll("rect");
			// 選択枠1つ + リサイズハンドル4つ = 5つのrect
			const handleRects = Array.from(resizeHandles).filter(
				(rect) => rect.getAttribute("width") === "8",
			);
			expect(handleRects).toHaveLength(4);
		});

		it("回転ハンドルが正しくレンダリングされる", () => {
			const { container } = render(
				<svg>
					<SelectionHandles
						x={100}
						y={100}
						width={50}
						height={50}
						rotation={0}
					/>
				</svg>,
			);

			const rotateHandle = container.querySelector("circle");
			expect(rotateHandle).toBeTruthy();
			expect(rotateHandle?.getAttribute("r")).toBe("4"); // HANDLE_SIZE / 2
		});
	});
});
