import type { BoardData, BoardObject } from "@/lib/stgy";

export interface ViewerBoard {
	id: string;
	stgyCode: string;
	boardData: BoardData | null;
	error: string | null;
	name: string;
}

export type ViewerMode = "tab" | "grid";

export interface ViewerState {
	boards: ViewerBoard[];
	activeId: string | null;
	viewMode: ViewerMode;
	selectedObjectIds: Record<string, string | null>;
}

export interface ActiveBoardSelection {
	objectId: string | null;
	object: BoardObject | null;
}

export const initialViewerState: ViewerState = {
	boards: [],
	activeId: null,
	viewMode: "tab",
	selectedObjectIds: {},
};

export const MAX_BOARDS = 30;
