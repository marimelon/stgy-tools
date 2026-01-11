/**
 * Editor actions - Unified entry point
 */

import type { EditorStore } from "../types";
import {
	type AlignmentActions,
	createAlignmentActions,
} from "./alignmentActions";
import {
	type ClipboardActions,
	createClipboardActions,
} from "./clipboardActions";
import { createGroupActions, type GroupActions } from "./groupActions";
import { createHistoryActions, type HistoryActions } from "./historyActions";
import { createLayerActions, type LayerActions } from "./layerActions";
import { createModeActions, type ModeActions } from "./modeActions";
import { createObjectActions, type ObjectActions } from "./objectActions";
import {
	createSelectionActions,
	type SelectionActions,
} from "./selectionActions";

export interface EditorActions
	extends SelectionActions,
		ObjectActions,
		HistoryActions,
		GroupActions,
		ClipboardActions,
		LayerActions,
		AlignmentActions,
		ModeActions {}

export function createAllActions(store: EditorStore): EditorActions {
	return {
		...createSelectionActions(store),
		...createObjectActions(store),
		...createHistoryActions(store),
		...createGroupActions(store),
		...createClipboardActions(store),
		...createLayerActions(store),
		...createAlignmentActions(store),
		...createModeActions(store),
	};
}

export {
	type AlignmentActions,
	createAlignmentActions,
} from "./alignmentActions";
export {
	type ClipboardActions,
	createClipboardActions,
} from "./clipboardActions";
export { createGroupActions, type GroupActions } from "./groupActions";
export { createHistoryActions, type HistoryActions } from "./historyActions";
export {
	createLayerActions,
	type LayerActions,
	type LayerDirection,
} from "./layerActions";
export { createModeActions, type ModeActions } from "./modeActions";
export { createObjectActions, type ObjectActions } from "./objectActions";
// Re-export individual action creators for tree-shaking
export {
	createSelectionActions,
	type SelectionActions,
} from "./selectionActions";
