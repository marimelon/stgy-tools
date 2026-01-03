/**
 * エディターアクションフック
 *
 * TanStack Store ベースのアクション作成
 */

import { useMemo } from "react";
import type { BackgroundId, Position } from "@/lib/stgy";
import { createDefaultObject } from "../factory";
import {
	type EditorActions as BaseEditorActions,
	createAllActions,
} from "../store/actions";
import { getEditorStore } from "../store/editorStore";
import type { AlignmentType, BatchUpdatePayload } from "../types";

/** エディターアクションの型（API互換性のため拡張） */
export interface EditorActions extends BaseEditorActions {
	/** オブジェクトを追加（objectIdとpositionから） */
	addObjectById: (objectId: number, position?: Position) => void;
	/** 選択中オブジェクトを一括更新 */
	updateSelectedObjectsBatch: (updates: BatchUpdatePayload) => void;
	/** ボードメタデータを更新（BackgroundId型） */
	updateBoardMetaTyped: (updates: {
		name?: string;
		backgroundId?: BackgroundId;
	}) => void;
	/** 選択中オブジェクトを整列 */
	alignSelected: (alignment: AlignmentType) => void;
	/** 選択中オブジェクトを削除 */
	deleteSelected: () => void;
	/** 選択中オブジェクトを複製 */
	duplicateSelected: () => void;
	/** 選択中オブジェクトをコピー */
	copySelected: () => void;
	/** 選択中オブジェクトをグループ化 */
	groupSelected: () => void;
}

/**
 * エディターアクションを取得するフック
 *
 * TanStack Store の setState を使用して状態を更新
 * アクションは安定した参照を持つため、再レンダリングの原因にならない
 */
export function useEditorActions(): EditorActions {
	const store = getEditorStore();

	return useMemo(() => {
		const baseActions = createAllActions(store);

		// API互換性のための拡張アクション
		const addObjectById = (objectId: number, position?: Position) => {
			const object = createDefaultObject(objectId, position);
			baseActions.addObject(object);
		};

		const updateSelectedObjectsBatch = (updates: BatchUpdatePayload) => {
			const state = store.state;
			if (state.selectedIds.length === 0) return;
			baseActions.updateObjectsBatch(state.selectedIds, updates);
		};

		const updateBoardMetaTyped = (updates: {
			name?: string;
			backgroundId?: BackgroundId;
		}) => {
			baseActions.updateBoardMeta(updates);
		};

		const alignSelected = (alignment: AlignmentType) => {
			const state = store.state;
			if (state.selectedIds.length < 2) return;
			baseActions.alignObjects(state.selectedIds, alignment);
		};

		const deleteSelected = () => {
			const state = store.state;
			if (state.selectedIds.length === 0) return;
			baseActions.deleteObjects(state.selectedIds);
		};

		const duplicateSelected = () => {
			const state = store.state;
			if (state.selectedIds.length === 0) return;
			baseActions.duplicateObjects(state.selectedIds);
		};

		const copySelected = () => {
			baseActions.copyObjects();
		};

		const groupSelected = () => {
			const state = store.state;
			if (state.selectedIds.length < 2) return;
			baseActions.groupObjects(state.selectedIds);
		};

		return {
			...baseActions,
			addObjectById,
			updateSelectedObjectsBatch,
			updateBoardMetaTyped,
			alignSelected,
			deleteSelected,
			duplicateSelected,
			copySelected,
			groupSelected,
		};
	}, [store]);
}

// 後方互換性のための型エクスポート（非推奨）
/** @deprecated EditorActionsを使用してください */
export type UseEditorActionsReturn = EditorActions;
