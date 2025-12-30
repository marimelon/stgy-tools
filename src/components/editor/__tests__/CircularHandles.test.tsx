/**
 * CircularHandles コンポーネントのテスト
 *
 * ハンドル操作時のclickイベント伝播を検証
 */

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CircularHandles } from "../CircularHandles";

describe("CircularHandles", () => {
	const mockCenter = { x: 256, y: 192 };
	const mockRadius = 100;

	describe("clickイベント伝播の防止", () => {
		it("中心ハンドル（rect）をクリックしてもイベントが伝播しない", () => {
			const onCenterDrag = vi.fn();
			const onCenterDragEnd = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<CircularHandles
						center={mockCenter}
						radius={mockRadius}
						onCenterDrag={onCenterDrag}
						onCenterDragEnd={onCenterDragEnd}
						onRadiusDrag={vi.fn()}
						onRadiusDragEnd={vi.fn()}
					/>
				</svg>,
			);

			// 中心ハンドル（rect）を取得
			const centerHandle = container.querySelector("rect");
			expect(centerHandle).toBeTruthy();

			// クリックイベント
			fireEvent.click(centerHandle!);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("半径ハンドル（circle）をクリックしてもイベントが伝播しない", () => {
			const onRadiusDrag = vi.fn();
			const onRadiusDragEnd = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<CircularHandles
						center={mockCenter}
						radius={mockRadius}
						onCenterDrag={vi.fn()}
						onCenterDragEnd={vi.fn()}
						onRadiusDrag={onRadiusDrag}
						onRadiusDragEnd={onRadiusDragEnd}
					/>
				</svg>,
			);

			// 半径ハンドル（circle）を取得
			const radiusHandle = container.querySelector("circle");
			expect(radiusHandle).toBeTruthy();

			// クリックイベント
			fireEvent.click(radiusHandle!);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("中心ハンドルのドラッグ後のクリックイベントも伝播しない", () => {
			const onCenterDrag = vi.fn();
			const onCenterDragEnd = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<CircularHandles
						center={mockCenter}
						radius={mockRadius}
						onCenterDrag={onCenterDrag}
						onCenterDragEnd={onCenterDragEnd}
						onRadiusDrag={vi.fn()}
						onRadiusDragEnd={vi.fn()}
					/>
				</svg>,
			);

			const centerHandle = container.querySelector("rect")!;

			// ドラッグシーケンス（PointerDown → PointerUp → Click）
			fireEvent.pointerDown(centerHandle);
			fireEvent.pointerUp(centerHandle);
			fireEvent.click(centerHandle);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("半径ハンドルのドラッグ後のクリックイベントも伝播しない", () => {
			const onRadiusDrag = vi.fn();
			const onRadiusDragEnd = vi.fn();
			const mockBackgroundClick = vi.fn();

			const { container } = render(
				<svg onClick={mockBackgroundClick}>
					<CircularHandles
						center={mockCenter}
						radius={mockRadius}
						onCenterDrag={vi.fn()}
						onCenterDragEnd={vi.fn()}
						onRadiusDrag={onRadiusDrag}
						onRadiusDragEnd={onRadiusDragEnd}
					/>
				</svg>,
			);

			const radiusHandle = container.querySelector("circle")!;

			// ドラッグシーケンス（PointerDown → PointerUp → Click）
			fireEvent.pointerDown(radiusHandle);
			fireEvent.pointerUp(radiusHandle);
			fireEvent.click(radiusHandle);

			// 背景のonClickが呼ばれていないことを確認
			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});
	});

	describe("コールバックの動作", () => {
		it("中心ハンドルのPointerDown/Upで正しくコールバックが呼ばれる", () => {
			const onCenterDragEnd = vi.fn();

			const { container } = render(
				<svg>
					<CircularHandles
						center={mockCenter}
						radius={mockRadius}
						onCenterDrag={vi.fn()}
						onCenterDragEnd={onCenterDragEnd}
						onRadiusDrag={vi.fn()}
						onRadiusDragEnd={vi.fn()}
					/>
				</svg>,
			);

			const centerHandle = container.querySelector("rect")!;
			fireEvent.pointerDown(centerHandle);
			fireEvent.pointerUp(centerHandle);

			expect(onCenterDragEnd).toHaveBeenCalledTimes(1);
		});

		it("半径ハンドルのPointerDown/Upで正しくコールバックが呼ばれる", () => {
			const onRadiusDragEnd = vi.fn();

			const { container } = render(
				<svg>
					<CircularHandles
						center={mockCenter}
						radius={mockRadius}
						onCenterDrag={vi.fn()}
						onCenterDragEnd={vi.fn()}
						onRadiusDrag={vi.fn()}
						onRadiusDragEnd={onRadiusDragEnd}
					/>
				</svg>,
			);

			const radiusHandle = container.querySelector("circle")!;
			fireEvent.pointerDown(radiusHandle);
			fireEvent.pointerUp(radiusHandle);

			expect(onRadiusDragEnd).toHaveBeenCalledTimes(1);
		});
	});

	describe("レンダリング", () => {
		it("中心ハンドル（rect）が正しくレンダリングされる", () => {
			const { container } = render(
				<svg>
					<CircularHandles
						center={mockCenter}
						radius={mockRadius}
						onCenterDrag={vi.fn()}
						onCenterDragEnd={vi.fn()}
						onRadiusDrag={vi.fn()}
						onRadiusDragEnd={vi.fn()}
					/>
				</svg>,
			);

			const centerHandle = container.querySelector("rect");
			expect(centerHandle).toBeTruthy();
			expect(centerHandle?.getAttribute("width")).toBe("10"); // HANDLE_SIZE
		});

		it("半径ハンドル（circle）が正しくレンダリングされる", () => {
			const { container } = render(
				<svg>
					<CircularHandles
						center={mockCenter}
						radius={mockRadius}
						onCenterDrag={vi.fn()}
						onCenterDragEnd={vi.fn()}
						onRadiusDrag={vi.fn()}
						onRadiusDragEnd={vi.fn()}
					/>
				</svg>,
			);

			const radiusHandle = container.querySelector("circle");
			expect(radiusHandle).toBeTruthy();
			expect(radiusHandle?.getAttribute("r")).toBe("5"); // HANDLE_SIZE / 2
		});

		it("接続線が正しくレンダリングされる", () => {
			const { container } = render(
				<svg>
					<CircularHandles
						center={mockCenter}
						radius={mockRadius}
						onCenterDrag={vi.fn()}
						onCenterDragEnd={vi.fn()}
						onRadiusDrag={vi.fn()}
						onRadiusDragEnd={vi.fn()}
					/>
				</svg>,
			);

			const line = container.querySelector("line");
			expect(line).toBeTruthy();
			expect(line?.getAttribute("stroke-dasharray")).toBe("4 2");
		});
	});
});
