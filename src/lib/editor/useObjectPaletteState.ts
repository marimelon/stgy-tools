/**
 * オブジェクトパレットの開閉状態管理フック
 *
 * localStorageを使用してカテゴリの展開状態を永続化
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "objectPaletteExpandedCategories";
const DEFAULT_EXPANDED = ["roles", "attacks"];

/**
 * オブジェクトパレットのカテゴリ展開状態を管理するフック
 */
export function useObjectPaletteState() {
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		() => {
			if (typeof window === "undefined") return new Set(DEFAULT_EXPANDED);
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				try {
					return new Set(JSON.parse(saved) as string[]);
				} catch {
					// ignore invalid data
				}
			}
			return new Set(DEFAULT_EXPANDED);
		},
	);

	// 状態変更時に自動保存
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...expandedCategories]));
	}, [expandedCategories]);

	const toggleCategory = (category: string) => {
		setExpandedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(category)) {
				next.delete(category);
			} else {
				next.add(category);
			}
			return next;
		});
	};

	return { expandedCategories, toggleCategory };
}
