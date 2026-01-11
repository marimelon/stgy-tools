/**
 * SelectionHandles component tests
 *
 * Verifies click event propagation prevention during handle interactions
 */

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SelectionHandles } from "../SelectionHandles";

describe("SelectionHandles", () => {
	describe("click event propagation prevention", () => {
		it("clicking rotate handle (circle) does not propagate event", () => {
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

			const rotateHandle = container.querySelector("circle");
			expect(rotateHandle).toBeTruthy();

			fireEvent.click(rotateHandle!);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("clicking resize handle (rect) does not propagate event", () => {
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
			);
			expect(resizeHandle).toBeTruthy();

			fireEvent.click(resizeHandle!);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("click event after dragging rotate handle does not propagate", () => {
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

			fireEvent.pointerDown(rotateHandle);
			fireEvent.pointerUp(rotateHandle);
			fireEvent.click(rotateHandle);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("click event after dragging resize handle does not propagate", () => {
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

			fireEvent.pointerDown(resizeHandle);
			fireEvent.pointerUp(resizeHandle);
			fireEvent.click(resizeHandle);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});
	});

	describe("callback behavior", () => {
		it("onRotateStart is called on rotate handle PointerDown", () => {
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

		it("onResizeStart is called on resize handle PointerDown", () => {
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

	describe("rendering", () => {
		it("4 resize handles render correctly", () => {
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
			// selection frame (1) + resize handles (4) = 5 rects
			const handleRects = Array.from(resizeHandles).filter(
				(rect) => rect.getAttribute("width") === "8",
			);
			expect(handleRects).toHaveLength(4);
		});

		it("rotate handle renders correctly", () => {
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
