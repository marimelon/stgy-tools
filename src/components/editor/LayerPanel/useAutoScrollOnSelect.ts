/**
 * Custom hook for auto-scrolling on selection
 */

import { useEffect, useRef } from "react";

/**
 * Scrolls the element into view when selection state becomes true.
 */
export function useAutoScrollOnSelect(isSelected: boolean) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isSelected && ref.current) {
			ref.current.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}
	}, [isSelected]);

	return ref;
}
