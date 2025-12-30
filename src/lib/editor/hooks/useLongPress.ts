/**
 * 長押し検出フック
 *
 * タッチデバイスでのコンテキストメニュー表示に使用
 */

import { useCallback, useRef } from "react";
import type { Position } from "@/lib/stgy";

/** 長押し判定時間（ミリ秒） */
const LONG_PRESS_DURATION = 500;
/** 長押し判定の移動閾値（ピクセル） */
const LONG_PRESS_MOVE_THRESHOLD = 10;

export interface UseLongPressParams {
	/** 長押し検出時のコールバック */
	onLongPress: (
		clientX: number,
		clientY: number,
		objectIndex: number | null,
	) => void;
}

export interface UseLongPressReturn {
	/** ポインターダウン時に呼び出す（長押しタイマー開始） */
	startLongPress: (e: React.PointerEvent, objectIndex: number | null) => void;
	/** ポインター移動時に呼び出す（閾値超えでキャンセル） */
	moveLongPress: (e: React.PointerEvent) => void;
	/** ポインターアップ時に呼び出す（タイマーキャンセル） */
	cancelLongPress: () => void;
}

interface LongPressState {
	timerId: ReturnType<typeof setTimeout>;
	startPosition: Position;
	objectIndex: number | null;
}

/**
 * 長押し検出フック
 */
export function useLongPress({
	onLongPress,
}: UseLongPressParams): UseLongPressReturn {
	const longPressStateRef = useRef<LongPressState | null>(null);

	/**
	 * 長押しタイマーをクリア
	 */
	const clearLongPressTimer = useCallback(() => {
		if (longPressStateRef.current) {
			clearTimeout(longPressStateRef.current.timerId);
			longPressStateRef.current = null;
		}
	}, []);

	/**
	 * 長押しタイマーを開始
	 */
	const startLongPress = useCallback(
		(e: React.PointerEvent, objectIndex: number | null) => {
			// マウスの場合は長押し不要（右クリックがある）
			if (e.pointerType === "mouse") return;

			// 既存のタイマーをクリア
			clearLongPressTimer();

			const clientX = e.clientX;
			const clientY = e.clientY;

			const timerId = setTimeout(() => {
				onLongPress(clientX, clientY, objectIndex);
				longPressStateRef.current = null;
			}, LONG_PRESS_DURATION);

			longPressStateRef.current = {
				timerId,
				startPosition: { x: clientX, y: clientY },
				objectIndex,
			};
		},
		[onLongPress, clearLongPressTimer],
	);

	/**
	 * ポインター移動時（閾値超えでキャンセル）
	 */
	const moveLongPress = useCallback(
		(e: React.PointerEvent) => {
			if (!longPressStateRef.current) return;

			const { startPosition } = longPressStateRef.current;
			const dx = e.clientX - startPosition.x;
			const dy = e.clientY - startPosition.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			// 移動距離が閾値を超えたらキャンセル
			if (distance > LONG_PRESS_MOVE_THRESHOLD) {
				clearLongPressTimer();
			}
		},
		[clearLongPressTimer],
	);

	/**
	 * 長押しをキャンセル
	 */
	const cancelLongPress = useCallback(() => {
		clearLongPressTimer();
	}, [clearLongPressTimer]);

	return {
		startLongPress,
		moveLongPress,
		cancelLongPress,
	};
}
