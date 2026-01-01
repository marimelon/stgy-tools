/**
 * エディター状態のReducer
 */

import i18n from "@/lib/i18n";
import type { BoardData } from "@/lib/stgy";
import {
	generateHistoryId,
	handleAddObject,
	handleAlignObjects,
	handleClearHistory,
	handleCommitHistory,
	handleCopyObjects,
	handleDeleteObjects,
	handleDeselectAll,
	handleDuplicateObjects,
	handleEndTextEdit,
	handleEnterCircularMode,
	handleExitCircularMode,
	handleGroupObjects,
	handleJumpToHistory,
	handleMoveLayer,
	handleMoveObjectOnCircle,
	handleMoveObjects,
	handlePasteObjects,
	handleRedo,
	handleRemoveFromGroup,
	handleRenameGroup,
	handleReorderGroup,
	handleReorderLayer,
	handleSelectObject,
	handleSelectObjects,
	handleSetBoard,
	handleSetFocusGroup,
	handleSetGridSettings,
	handleStartTextEdit,
	handleToggleGroupCollapse,
	handleUndo,
	handleUngroup,
	handleUpdateBoardMeta,
	handleUpdateCircularCenter,
	handleUpdateCircularRadius,
	handleUpdateObject,
	handleUpdateObjectsBatch,
} from "./reducerHandlers";
import {
	DEFAULT_OVERLAY_SETTINGS,
	type EditorAction,
	type EditorState,
	type GridSettings,
	type ObjectGroup,
} from "./types";

/**
 * エディターReducer
 */
export function editorReducer(
	state: EditorState,
	action: EditorAction,
): EditorState {
	switch (action.type) {
		case "SET_BOARD":
			return handleSetBoard(state, { board: action.board });

		case "SELECT_OBJECT":
			return handleSelectObject(state, {
				index: action.index,
				additive: action.additive,
			});

		case "SELECT_OBJECTS":
			return handleSelectObjects(state, { indices: action.indices });

		case "DESELECT_ALL":
			return handleDeselectAll(state);

		case "UPDATE_OBJECT":
			return handleUpdateObject(state, {
				index: action.index,
				updates: action.updates,
			});

		case "ADD_OBJECT":
			return handleAddObject(state, { object: action.object });

		case "DELETE_OBJECTS":
			return handleDeleteObjects(state, { indices: action.indices });

		case "DUPLICATE_OBJECTS":
			return handleDuplicateObjects(state, { indices: action.indices });

		case "COPY_OBJECTS":
			return handleCopyObjects(state);

		case "PASTE_OBJECTS":
			return handlePasteObjects(state, { position: action.position });

		case "MOVE_OBJECTS":
			return handleMoveObjects(state, {
				indices: action.indices,
				deltaX: action.deltaX,
				deltaY: action.deltaY,
			});

		case "COMMIT_HISTORY":
			return handleCommitHistory(state, { description: action.description });

		case "UPDATE_BOARD_META":
			return handleUpdateBoardMeta(state, { updates: action.updates });

		case "UNDO":
			return handleUndo(state);

		case "REDO":
			return handleRedo(state);

		case "MOVE_LAYER":
			return handleMoveLayer(state, {
				index: action.index,
				direction: action.direction,
			});

		case "REORDER_LAYER":
			return handleReorderLayer(state, {
				fromIndex: action.fromIndex,
				toIndex: action.toIndex,
			});

		case "REORDER_GROUP":
			return handleReorderGroup(state, {
				groupId: action.groupId,
				toIndex: action.toIndex,
			});

		case "GROUP_OBJECTS":
			return handleGroupObjects(state, { indices: action.indices });

		case "UNGROUP":
			return handleUngroup(state, { groupId: action.groupId });

		case "RENAME_GROUP":
			return handleRenameGroup(state, {
				groupId: action.groupId,
				name: action.name,
			});

		case "TOGGLE_GROUP_COLLAPSE":
			return handleToggleGroupCollapse(state, { groupId: action.groupId });

		case "REMOVE_FROM_GROUP":
			return handleRemoveFromGroup(state, { objectIndex: action.objectIndex });

		case "SET_GRID_SETTINGS":
			return handleSetGridSettings(state, { settings: action.settings });

		case "SET_FOCUS_GROUP":
			return handleSetFocusGroup(state, { groupId: action.groupId });

		case "ALIGN_OBJECTS":
			return handleAlignObjects(state, {
				indices: action.indices,
				alignment: action.alignment,
			});

		case "UPDATE_OBJECTS_BATCH":
			return handleUpdateObjectsBatch(state, {
				indices: action.indices,
				updates: action.updates,
			});

		case "START_TEXT_EDIT":
			return handleStartTextEdit(state, { index: action.index });

		case "END_TEXT_EDIT":
			return handleEndTextEdit(state, {
				save: action.save,
				text: action.text,
			});

		case "JUMP_TO_HISTORY":
			return handleJumpToHistory(state, { index: action.index });

		case "CLEAR_HISTORY":
			return handleClearHistory(state);

		case "SET_ERROR":
			return { ...state, lastError: action.error };

		case "CLEAR_ERROR":
			return { ...state, lastError: null };

		case "ENTER_CIRCULAR_MODE":
			return handleEnterCircularMode(state, {
				center: action.center,
				radius: action.radius,
				indices: action.indices,
			});

		case "EXIT_CIRCULAR_MODE":
			return handleExitCircularMode(state);

		case "UPDATE_CIRCULAR_CENTER":
			return handleUpdateCircularCenter(state, { center: action.center });

		case "UPDATE_CIRCULAR_RADIUS":
			return handleUpdateCircularRadius(state, { radius: action.radius });

		case "MOVE_OBJECT_ON_CIRCLE":
			return handleMoveObjectOnCircle(state, {
				index: action.index,
				angle: action.angle,
			});

		default:
			return state;
	}
}

/** デフォルトのグリッド設定 */
const DEFAULT_GRID_SETTINGS: GridSettings = {
	enabled: false,
	size: 16,
	showGrid: false,
	overlayType: "none",
	showBackground: true,
	canvasColor: "slate-800",
	overlaySettings: DEFAULT_OVERLAY_SETTINGS,
};

/**
 * 初期状態生成オプション
 */
export interface CreateInitialStateOptions {
	board: BoardData;
	groups?: ObjectGroup[];
	gridSettings?: GridSettings;
}

/**
 * 初期状態を生成
 */
export function createInitialState(board: BoardData): EditorState {
	return createInitialStateWithOptions({ board });
}

/**
 * オプション付きで初期状態を生成
 */
export function createInitialStateWithOptions(
	options: CreateInitialStateOptions,
): EditorState {
	const { board, groups = [], gridSettings } = options;
	const initialGroups = structuredClone(groups);
	const initialGridSettings = gridSettings
		? { ...gridSettings }
		: { ...DEFAULT_GRID_SETTINGS };

	return {
		board: structuredClone(board),
		selectedIndices: [],
		clipboard: null,
		groups: initialGroups,
		gridSettings: initialGridSettings,
		history: [
			{
				id: generateHistoryId(),
				board: structuredClone(board),
				groups: initialGroups,
				description: i18n.t("history.initial"),
			},
		],
		historyIndex: 0,
		isDirty: false,
		editingTextIndex: null,
		lastError: null,
		focusedGroupId: null,
		circularMode: null,
	};
}
