/**
 * Toolbar size detection hook
 *
 * Determines layout mode based on container size
 */

import { type RefObject, useCallback, useEffect, useState } from "react";

/** Toolbar layout mode */
export type ToolbarSize = "large" | "medium" | "small";

/** Breakpoint definitions */
const BREAKPOINTS = {
	large: 1200,
	medium: 800,
} as const;

/**
 * Hook to determine toolbar layout mode based on container size
 *
 * @param containerRef - ref to the container element to observe
 * @returns Current toolbar size mode
 */
export function useToolbarSize(
	containerRef: RefObject<HTMLElement | null>,
): ToolbarSize {
	const [size, setSize] = useState<ToolbarSize>("large");

	const updateSize = useCallback((width: number) => {
		if (width >= BREAKPOINTS.large) {
			setSize("large");
		} else if (width >= BREAKPOINTS.medium) {
			setSize("medium");
		} else {
			setSize("small");
		}
	}, []);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Set initial size
		updateSize(container.offsetWidth);

		// Monitor size changes with ResizeObserver
		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const width = entry.contentRect.width;
				updateSize(width);
			}
		});

		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
		};
	}, [containerRef, updateSize]);

	return size;
}
