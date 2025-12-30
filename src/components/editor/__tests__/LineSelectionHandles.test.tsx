/**
 * LineSelectionHandles コンポーネントのテスト
 *
 * ハンドル操作時のclickイベント伝播を検証
 */

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LineSelectionHandles } from "../LineSelectionHandles";

describe("LineSelectionHandles", () => {
	describe("clickイベント伝播の防止", () => {
		it("始点ハンドル（rect）をクリックしてもイベントが伝播しない", () => {
			const onStartPointDrag = vi.fn();
			const onStartPointDragEnd = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<LineSelectionHandles
						startX={100}
						startY={100}
						endX={200}
						endY={200}
						onStartPointDrag={onStartPointDrag}
						onStartPointDragEnd={onStartPointDragEnd}
					/>
				</svg>,
			);

			// 始点ハンドル（rect）を取得
			const startHandle = container.querySelector("rect");
			expect(startHandle).toBeTruthy();

			// クリックイベント
			fireEvent.click(startHandle!);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("終点ハンドル（circle）をクリックしてもイベントが伝播しない", () => {
			const onEndPointDrag = vi.fn();
			const onEndPointDragEnd = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<LineSelectionHandles
						startX={100}
						startY={100}
						endX={200}
						endY={200}
						onEndPointDrag={onEndPointDrag}
						onEndPointDragEnd={onEndPointDragEnd}
					/>
				</svg>,
			);

			// 終点ハンドル（circle）を取得
			const endHandle = container.querySelector("circle");
			expect(endHandle).toBeTruthy();

			// クリックイベント
			fireEvent.click(endHandle!);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("始点ハンドルのドラッグ後のクリックイベントも伝播しない", () => {
			const onStartPointDrag = vi.fn();
			const onStartPointDragEnd = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<LineSelectionHandles
						startX={100}
						startY={100}
						endX={200}
						endY={200}
						onStartPointDrag={onStartPointDrag}
						onStartPointDragEnd={onStartPointDragEnd}
					/>
				</svg>,
			);

			const startHandle = container.querySelector("rect")!;

			// ドラッグシーケンス（PointerDown → PointerUp → Click）
			fireEvent.pointerDown(startHandle, { clientX: 100, clientY: 100 });
			fireEvent.pointerUp(startHandle, { clientX: 105, clientY: 105 });
			fireEvent.click(startHandle);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("終点ハンドルのドラッグ後のクリックイベントも伝播しない", () => {
			const onEndPointDrag = vi.fn();
			const onEndPointDragEnd = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<LineSelectionHandles
						startX={100}
						startY={100}
						endX={200}
						endY={200}
						onEndPointDrag={onEndPointDrag}
						onEndPointDragEnd={onEndPointDragEnd}
					/>
				</svg>,
			);

			const endHandle = container.querySelector("circle")!;

			// ドラッグシーケンス（PointerDown → PointerUp → Click）
			fireEvent.pointerDown(endHandle, { clientX: 200, clientY: 200 });
			fireEvent.pointerUp(endHandle, { clientX: 205, clientY: 205 });
			fireEvent.click(endHandle);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});
	});

	describe("コールバックの動作", () => {
		it("始点ハンドルのPointerDownでonStartPointDragStartが呼ばれる", () => {
			const onStartPointDragStart = vi.fn();
			const onStartPointDrag = vi.fn();

			const { container } = render(
				<svg>
					<LineSelectionHandles
						startX={100}
						startY={100}
						endX={200}
						endY={200}
						onStartPointDragStart={onStartPointDragStart}
						onStartPointDrag={onStartPointDrag}
					/>
				</svg>,
			);

			const startHandle = container.querySelector("rect")!;
			fireEvent.pointerDown(startHandle);

			expect(onStartPointDragStart).toHaveBeenCalledTimes(1);
		});

		it("終点ハンドルのPointerDownでonEndPointDragStartが呼ばれる", () => {
			const onEndPointDragStart = vi.fn();
			const onEndPointDrag = vi.fn();

			const { container } = render(
				<svg>
					<LineSelectionHandles
						startX={100}
						startY={100}
						endX={200}
						endY={200}
						onEndPointDragStart={onEndPointDragStart}
						onEndPointDrag={onEndPointDrag}
					/>
				</svg>,
			);

			const endHandle = container.querySelector("circle")!;
			fireEvent.pointerDown(endHandle);

			expect(onEndPointDragStart).toHaveBeenCalledTimes(1);
		});
	});
});
