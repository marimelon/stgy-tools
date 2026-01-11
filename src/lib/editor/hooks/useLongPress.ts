/**
 * Long press detection hook
 *
 * Used to show context menu on touch devices
 */

import { useCallback, useRef } from "react";
import type { Position } from "@/lib/stgy";

/** Long press detection duration (ms) */
const LONG_PRESS_DURATION = 500;
/** Movement threshold for long press detection (px) */
const LONG_PRESS_MOVE_THRESHOLD = 10;

export interface UseLongPressParams {
	onLongPress: (
		clientX: number,
		clientY: number,
		objectId: string | null,
	) => void;
}

export interface UseLongPressReturn {
	startLongPress: (e: React.PointerEvent, objectId: string | null) => void;
	moveLongPress: (e: React.PointerEvent) => void;
	cancelLongPress: () => void;
}

interface LongPressState {
	timerId: ReturnType<typeof setTimeout>;
	startPosition: Position;
	objectId: string | null;
}

export function useLongPress({
	onLongPress,
}: UseLongPressParams): UseLongPressReturn {
	const longPressStateRef = useRef<LongPressState | null>(null);

	const clearLongPressTimer = useCallback(() => {
		if (longPressStateRef.current) {
			clearTimeout(longPressStateRef.current.timerId);
			longPressStateRef.current = null;
		}
	}, []);

	const startLongPress = useCallback(
		(e: React.PointerEvent, objectId: string | null) => {
			// Skip for mouse (has right-click)
			if (e.pointerType === "mouse") return;

			clearLongPressTimer();

			const clientX = e.clientX;
			const clientY = e.clientY;

			const timerId = setTimeout(() => {
				onLongPress(clientX, clientY, objectId);
				longPressStateRef.current = null;
			}, LONG_PRESS_DURATION);

			longPressStateRef.current = {
				timerId,
				startPosition: { x: clientX, y: clientY },
				objectId,
			};
		},
		[onLongPress, clearLongPressTimer],
	);

	const moveLongPress = useCallback(
		(e: React.PointerEvent) => {
			if (!longPressStateRef.current) return;

			const { startPosition } = longPressStateRef.current;
			const dx = e.clientX - startPosition.x;
			const dy = e.clientY - startPosition.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance > LONG_PRESS_MOVE_THRESHOLD) {
				clearLongPressTimer();
			}
		},
		[clearLongPressTimer],
	);

	const cancelLongPress = useCallback(() => {
		clearLongPressTimer();
	}, [clearLongPressTimer]);

	return {
		startLongPress,
		moveLongPress,
		cancelLongPress,
	};
}
