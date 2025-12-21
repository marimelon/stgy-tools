/**
 * ツールバーサイズ検出フック
 *
 * コンテナのサイズに基づいてレイアウトモードを決定
 */

import { useState, useEffect, useCallback, type RefObject } from "react";

/** ツールバーのレイアウトモード */
export type ToolbarSize = "large" | "medium" | "small";

/** ブレークポイント定義 */
const BREAKPOINTS = {
	large: 1200,
	medium: 800,
} as const;

/**
 * コンテナサイズに基づいてツールバーのレイアウトモードを決定するフック
 *
 * @param containerRef - 監視対象のコンテナ要素のref
 * @returns 現在のツールバーサイズモード
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

		// 初期サイズを設定
		updateSize(container.offsetWidth);

		// ResizeObserverでサイズ変更を監視
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
