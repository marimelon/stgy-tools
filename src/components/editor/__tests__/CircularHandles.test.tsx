/**
 * CircularHandles component tests
 *
 * Verifies click event propagation prevention during handle interactions
 */

import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CircularHandles } from "../CircularHandles";

describe("CircularHandles", () => {
	const mockCenter = { x: 256, y: 192 };
	const mockRadius = 100;

	describe("click event propagation prevention", () => {
		it("clicking center handle (rect) does not propagate event", () => {
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

			const centerHandle = container.querySelector("rect");
			expect(centerHandle).toBeTruthy();

			fireEvent.click(centerHandle!);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("clicking radius handle (circle) does not propagate event", () => {
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

			const radiusHandle = container.querySelector("circle");
			expect(radiusHandle).toBeTruthy();

			fireEvent.click(radiusHandle!);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("click event after dragging center handle does not propagate", () => {
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

			fireEvent.pointerDown(centerHandle);
			fireEvent.pointerUp(centerHandle);
			fireEvent.click(centerHandle);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});

		it("click event after dragging radius handle does not propagate", () => {
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

			fireEvent.pointerDown(radiusHandle);
			fireEvent.pointerUp(radiusHandle);
			fireEvent.click(radiusHandle);

			expect(mockBackgroundClick).not.toHaveBeenCalled();
		});
	});

	describe("callback behavior", () => {
		it("callbacks are called correctly on center handle PointerDown/Up", () => {
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

		it("callbacks are called correctly on radius handle PointerDown/Up", () => {
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

	describe("rendering", () => {
		it("center handle (rect) renders correctly", () => {
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

		it("radius handle (circle) renders correctly", () => {
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

		it("connection line renders correctly", () => {
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
