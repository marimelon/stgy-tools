/**
 * SVGハンドル用の共通イベントハンドラフック
 *
 * SVGハンドル要素（rect, circle等）で使用する共通のイベントハンドラを提供。
 * onClick で stopPropagation を呼ぶことで、ドラッグ終了時に背景のクリックイベントが
 * 発火して選択が解除されるバグを防ぐ。
 */

import { useCallback } from "react";

/**
 * SVGハンドル用の共通イベントハンドラを提供するフック
 *
 * @returns stopPropagation - clickイベントの伝播を止めるハンドラ
 *
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
	/**
	 * イベントの伝播を止める（背景クリックによる選択解除を防ぐ）
	 */
	const stopPropagation = useCallback((e: React.SyntheticEvent) => {
		e.stopPropagation();
	}, []);

	return { stopPropagation };
}
