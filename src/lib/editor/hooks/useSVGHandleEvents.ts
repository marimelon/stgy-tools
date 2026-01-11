/**
 * Common event handler hook for SVG handles
 *
 * Provides common event handlers for SVG handle elements (rect, circle, etc.).
 * stopPropagation on onClick prevents the bug where background click event fires
 * on drag end, causing selection to clear.
 */

import { useCallback } from "react";

/**
 * @example
 * ```tsx
 * function MyHandleComponent() {
 *   const { stopPropagation } = useSVGHandleEvents();
 *
 *   return (
 *     <circle
 *       cx={x}
 *       cy={y}
 *       r={5}
 *       onClick={stopPropagation}
 *       onPointerDown={handlePointerDown}
 *     />
 *   );
 * }
 * ```
 */
export function useSVGHandleEvents() {
	const stopPropagation = useCallback((e: React.SyntheticEvent) => {
		e.stopPropagation();
	}, []);

	return { stopPropagation };
}
