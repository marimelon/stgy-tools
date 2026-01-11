/**
 * Editor actions hook
 *
 * TanStack Store based action creation
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

export interface EditorActions extends BaseEditorActions {
	addObjectById: (objectId: number, position?: Position) => void;
	updateSelectedObjectsBatch: (updates: BatchUpdatePayload) => void;
	updateBoardMetaTyped: (updates: {
		name?: string;
		backgroundId?: BackgroundId;
	}) => void;
	alignSelected: (alignment: AlignmentType) => void;
	deleteSelected: () => void;
	duplicateSelected: () => void;
	copySelected: () => void;
	groupSelected: () => void;
}

/**
 * Get editor actions hook
 *
 * Uses TanStack Store's setState to update state.
 * Actions have stable references, so they don't cause re-renders.
 */
export function useEditorActions(): EditorActions {
	const store = getEditorStore();

	return useMemo(() => {
		const baseActions = createAllActions(store);

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

/** @deprecated Use EditorActions instead */
export type UseEditorActionsReturn = EditorActions;
