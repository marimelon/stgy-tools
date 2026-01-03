/**
 * レイヤーコンテキストメニュー管理フック
 */

import { useCallback, useState } from "react";
import type { ObjectGroup } from "@/lib/editor/types";
import type { LayerContextMenuState } from "./types";

const initialState: LayerContextMenuState = {
	isOpen: false,
	x: 0,
	y: 0,
	target: null,
};

export interface UseLayerContextMenuReturn {
	menuState: LayerContextMenuState;
	openObjectMenu: (
		e: React.MouseEvent,
		objectId: string,
		isInGroup: boolean,
		groupId?: string,
	) => void;
	openGroupMenu: (e: React.MouseEvent, group: ObjectGroup) => void;
	closeMenu: () => void;
}

/**
 * レイヤーコンテキストメニューを管理するフック
 */
export function useLayerContextMenu(): UseLayerContextMenuReturn {
	const [menuState, setMenuState] =
		useState<LayerContextMenuState>(initialState);

	// オブジェクトのコンテキストメニューを開く
	const openObjectMenu = useCallback(
		(
			e: React.MouseEvent,
			objectId: string,
			isInGroup: boolean,
			groupId?: string,
		) => {
			e.preventDefault();
			e.stopPropagation();
			setMenuState({
				isOpen: true,
				x: e.clientX,
				y: e.clientY,
				target: { type: "object", objectId, isInGroup, groupId },
			});
		},
		[],
	);

	// グループのコンテキストメニューを開く
	const openGroupMenu = useCallback(
		(e: React.MouseEvent, group: ObjectGroup) => {
			e.preventDefault();
			e.stopPropagation();
			setMenuState({
				isOpen: true,
				x: e.clientX,
				y: e.clientY,
				target: { type: "group", group },
			});
		},
		[],
	);

	// メニューを閉じる
	const closeMenu = useCallback(() => {
		setMenuState(initialState);
	}, []);

	return {
		menuState,
		openObjectMenu,
		openGroupMenu,
		closeMenu,
	};
}
