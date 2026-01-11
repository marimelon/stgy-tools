/**
 * Editor state management type definitions
 */

import type {
	BackgroundId,
	BoardData,
	BoardObject,
	Color,
	ObjectFlags,
	Position,
} from "@/lib/stgy";

/** Resize handle position */
export type ResizeHandle = "nw" | "ne" | "sw" | "se";

/** Handle type */
export type HandleType = ResizeHandle | "rotate";

/** Interaction mode */
export type InteractionMode = "none" | "drag" | "rotate" | "resize" | "marquee";

/** Drag state */
export interface DragState {
	/** Current mode */
	mode: InteractionMode;
	/** Pointer position at drag start */
	startPointer: Position;
	/** Object state at drag start */
	startObjectState: BoardObject;
	/** Initial positions of all selected objects (for grid snap) */
	startPositions: Map<string, Position>;
	/** Handle being operated */
	handle?: HandleType;
	/** Target object ID */
	objectId: string;
}

/** Marquee selection state */
export interface MarqueeState {
	/** Start position */
	startPoint: Position;
	/** Current position */
	currentPoint: Position;
}

/**
 * Circular arrangement mode state
 * Used in edit mode after circular arrangement execution
 */
export interface CircularModeState {
	/** Circle center position */
	center: Position;
	/** Circle radius */
	radius: number;
	/** Participating object IDs */
	participatingIds: string[];
	/** Each object's angle (id -> angle in radians) */
	objectAngles: Map<string, number>;
}

/** EditorBoard component Props */
export interface EditorBoardProps {
	/** Display scale */
	scale?: number;
}

/**
 * Object group
 */
export interface ObjectGroup {
	/** Group ID */
	id: string;
	/** Object IDs in the group */
	objectIds: string[];
	/** Group name (optional) */
	name?: string;
	/** Collapsed state */
	collapsed?: boolean;
}

/**
 * History entry
 */
export interface HistoryEntry {
	/** Unique ID */
	id: string;
	/** Board data snapshot */
	board: BoardData;
	/** Group info snapshot */
	groups: ObjectGroup[];
	/** Operation description */
	description: string;
}

/** Editor overlay grid type */
export type EditorOverlayType = "none" | "concentric" | "square";

/** Available overlay types */
export const EDITOR_OVERLAY_TYPES = ["none", "concentric", "square"] as const;

/** Canvas background color presets */
export const CANVAS_COLORS = [
	{ id: "slate-900", color: "#0f172a", label: "Dark" },
	{ id: "slate-800", color: "#1e293b", label: "Default" },
	{ id: "slate-700", color: "#334155", label: "Gray" },
	{ id: "neutral-900", color: "#171717", label: "Black" },
	{ id: "green-950", color: "#052e16", label: "Green" },
	{ id: "blue-950", color: "#172554", label: "Blue" },
] as const;

export type CanvasColorId = (typeof CANVAS_COLORS)[number]["id"];

/** Overlay color presets */
export const OVERLAY_COLORS = [
	{ id: "cyan", color: "100, 200, 255", label: "Cyan" },
	{ id: "red", color: "255, 100, 100", label: "Red" },
	{ id: "green", color: "100, 255, 100", label: "Green" },
	{ id: "yellow", color: "255, 255, 100", label: "Yellow" },
	{ id: "white", color: "255, 255, 255", label: "White" },
] as const;

export type OverlayColorId = (typeof OVERLAY_COLORS)[number]["id"];

/** Square grid size options */
export const OVERLAY_GRID_SIZES = [16, 24, 32, 48, 64] as const;
export type OverlayGridSize = (typeof OVERLAY_GRID_SIZES)[number];

/**
 * Overlay detailed settings
 */
export interface OverlaySettings {
	/** Number of concentric circles (3-10) */
	circleCount: number;
	/** Square grid size (px) */
	squareGridSize: OverlayGridSize;
	/** Overlay color ID */
	colorId: OverlayColorId;
	/** Opacity (20-100) */
	opacity: number;
	/** Show center marker */
	showCenterMarker: boolean;
	/** Show guide lines (8 directions) */
	showGuideLines: boolean;
	/** Show outer border */
	showBorder: boolean;
}

/** Default overlay settings */
export const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
	circleCount: 5,
	squareGridSize: 32,
	colorId: "cyan",
	opacity: 40,
	showCenterMarker: true,
	showGuideLines: true,
	showBorder: true,
};

/**
 * Grid settings
 */
export interface GridSettings {
	/** Grid snap enabled */
	enabled: boolean;
	/** Grid size (px) */
	size: number;
	/** Show grid lines */
	showGrid: boolean;
	/** Editor overlay grid type */
	overlayType: EditorOverlayType;
	/** Show background */
	showBackground: boolean;
	/** Canvas background color (when background hidden) */
	canvasColor: CanvasColorId;
	/** Overlay detailed settings */
	overlaySettings: OverlaySettings;
}

/** Available grid sizes */
export const GRID_SIZES = [8, 16, 32] as const;
export type GridSize = (typeof GRID_SIZES)[number];

/** Maximum history entries */
export const MAX_HISTORY_SIZE = 50;

/**
 * Batch update payload
 * Update content to apply to multiple objects (only updates specified properties)
 */
export interface BatchUpdatePayload {
	rotation?: number;
	size?: number;
	color?: Partial<Color>;
	flags?: Partial<ObjectFlags>;
	param1?: number;
	param2?: number;
	param3?: number;
}

/** Alignment type */
export type AlignmentType =
	| "left"
	| "center"
	| "right"
	| "top"
	| "middle"
	| "bottom"
	| "distribute-h"
	| "distribute-v"
	| "circular";

/**
 * Error information
 */
export interface EditorError {
	/** Translation key */
	key: string;
	/** Translation parameters */
	params?: Record<string, string | number>;
}

/**
 * Editor state
 */
export interface EditorState {
	/** Current board data */
	board: BoardData;
	/** Selected object IDs (multi-select supported) */
	selectedIds: string[];
	/** Object groups */
	groups: ObjectGroup[];
	/** Grid settings */
	gridSettings: GridSettings;
	/** History */
	history: HistoryEntry[];
	/** Current history position */
	historyIndex: number;
	/** Whether there are unsaved changes */
	isDirty: boolean;
	/** ID of text object being inline-edited (null = no editing) */
	editingTextId: string | null;
	/** Last error (cleared after UI display) */
	lastError: EditorError | null;
	/** Focused group ID (null = no focus) */
	focusedGroupId: string | null;
	/** Circular arrangement mode state (null = mode disabled) */
	circularMode: CircularModeState | null;
}

/**
 * Editor action
 */
export type EditorAction =
	| { type: "SET_BOARD"; board: BoardData }
	| { type: "SELECT_OBJECT"; objectId: string; additive?: boolean }
	| { type: "SELECT_OBJECTS"; objectIds: string[] }
	| { type: "DESELECT_ALL" }
	| { type: "UPDATE_OBJECT"; objectId: string; updates: Partial<BoardObject> }
	| { type: "ADD_OBJECT"; object: BoardObject }
	| { type: "DELETE_OBJECTS"; objectIds: string[] }
	| { type: "DUPLICATE_OBJECTS"; objectIds: string[] }
	| { type: "COPY_OBJECTS" }
	| { type: "PASTE_OBJECTS"; position?: { x: number; y: number } }
	| { type: "UNDO" }
	| { type: "REDO" }
	| {
			type: "UPDATE_BOARD_META";
			updates: Partial<Pick<BoardData, "name" | "backgroundId">>;
	  }
	| {
			type: "MOVE_OBJECTS";
			objectIds: string[];
			deltaX: number;
			deltaY: number;
	  }
	| { type: "COMMIT_HISTORY"; description: string }
	| {
			type: "MOVE_LAYER";
			objectId: string;
			direction: "front" | "back" | "forward" | "backward";
	  }
	| { type: "GROUP_OBJECTS"; objectIds: string[] }
	| { type: "UNGROUP"; groupId: string }
	| { type: "RENAME_GROUP"; groupId: string; name: string }
	| { type: "TOGGLE_GROUP_COLLAPSE"; groupId: string }
	| { type: "SET_GRID_SETTINGS"; settings: Partial<GridSettings> }
	| { type: "ALIGN_OBJECTS"; objectIds: string[]; alignment: AlignmentType }
	| { type: "REORDER_LAYER"; fromIndex: number; toIndex: number }
	| { type: "REMOVE_FROM_GROUP"; objectId: string }
	| { type: "REORDER_GROUP"; groupId: string; toIndex: number }
	| {
			type: "UPDATE_OBJECTS_BATCH";
			objectIds: string[];
			updates: BatchUpdatePayload;
	  }
	| { type: "START_TEXT_EDIT"; objectId: string }
	| { type: "END_TEXT_EDIT"; save: boolean; text?: string }
	| { type: "JUMP_TO_HISTORY"; index: number }
	| { type: "CLEAR_HISTORY" }
	| { type: "SET_ERROR"; error: EditorError }
	| { type: "CLEAR_ERROR" }
	| { type: "SET_FOCUS_GROUP"; groupId: string | null }
	| {
			type: "ENTER_CIRCULAR_MODE";
			center: Position;
			radius: number;
			objectIds: string[];
	  }
	| { type: "EXIT_CIRCULAR_MODE" }
	| { type: "UPDATE_CIRCULAR_CENTER"; center: Position }
	| { type: "UPDATE_CIRCULAR_RADIUS"; radius: number }
	| { type: "MOVE_OBJECT_ON_CIRCLE"; objectId: string; angle: number };

/**
 * Partial type for board metadata updates
 */
export interface BoardMetaUpdates {
	name?: string;
	backgroundId?: BackgroundId;
}
