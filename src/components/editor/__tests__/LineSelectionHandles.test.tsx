/**
 * LineSelectionHandles component tests
 *
 * Verifies click event propagation prevention during handle interactions
 */

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LineSelectionHandles } from "../LineSelectionHandles";

describe("LineSelectionHandles", () => {
	describe("click event propagation prevention", () => {
		it("clicking start handle (rect) does not propagate event", () => {
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

			const startHandle = container.querySelector("rect");
			expect(startHandle).toBeTruthy();

			fireEvent.click(startHandle!);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("clicking end handle (circle) does not propagate event", () => {
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

			const endHandle = container.querySelector("circle");
			expect(endHandle).toBeTruthy();

			fireEvent.click(endHandle!);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("click event after dragging start handle does not propagate", () => {
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

			fireEvent.pointerDown(startHandle, { clientX: 100, clientY: 100 });
			fireEvent.pointerUp(startHandle, { clientX: 105, clientY: 105 });
			fireEvent.click(startHandle);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("click event after dragging end handle does not propagate", () => {
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

			fireEvent.pointerDown(endHandle, { clientX: 200, clientY: 200 });
			fireEvent.pointerUp(endHandle, { clientX: 205, clientY: 205 });
			fireEvent.click(endHandle);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});
	});

	describe("callback behavior", () => {
		it("onStartPointDragStart is called on start handle PointerDown", () => {
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

		it("onEndPointDragStart is called on end handle PointerDown", () => {
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
