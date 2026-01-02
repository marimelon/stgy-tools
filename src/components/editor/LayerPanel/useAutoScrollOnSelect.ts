/**
 * 選択時に自動スクロールするためのカスタムフック
 */

import { useEffect, useRef } from "react";

/**
 * 選択状態が true になったときに要素を表示領域にスクロールする
 * @param isSelected 選択状態
 * @returns スクロール対象要素に設定するref
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
