import { useMemo } from "react";
import type { BoardObject } from "@/lib/stgy";
import { useViewerSelector } from "./context";
import type { ActiveBoardSelection, ViewerBoard, ViewerMode } from "./types";
import { MAX_BOARDS } from "./types";

export function useViewerBoards(): ViewerBoard[] {
	return useViewerSelector((state) => state.boards);
}

export function useViewerActiveId(): string | null {
	return useViewerSelector((state) => state.activeId);
}

export function useViewerActiveBoard(): ViewerBoard | null {
	const boards = useViewerBoards();
	const activeId = useViewerActiveId();
	return useMemo(
		() => boards.find((b) => b.id === activeId) ?? null,
		[boards, activeId],
	);
}

export function useViewerMode(): ViewerMode {
	return useViewerSelector((state) => state.viewMode);
}

export function useViewerBoardCount(): number {
	return useViewerSelector((state) => state.boards.length);
}

export function useViewerValidBoardCount(): number {
	return useViewerSelector(
		(state) => state.boards.filter((b) => b.boardData !== null).length,
	);
}

export function useViewerActiveSelection(): ActiveBoardSelection {
	const activeBoard = useViewerActiveBoard();
	const selectedObjectIds = useViewerSelector(
		(state) => state.selectedObjectIds,
	);

	return useMemo(() => {
		if (!activeBoard) {
			return { objectId: null, object: null };
		}

		const objectId = selectedObjectIds[activeBoard.id] ?? null;
		if (!objectId || !activeBoard.boardData) {
			return { objectId: null, object: null };
		}

		const object =
			activeBoard.boardData.objects.find((o) => o.id === objectId) ?? null;
		return { objectId, object };
	}, [activeBoard, selectedObjectIds]);
}

export function useViewerBoardSelection(boardId: string): {
	objectId: string | null;
	object: BoardObject | null;
} {
	const boards = useViewerBoards();
	const selectedObjectIds = useViewerSelector(
		(state) => state.selectedObjectIds,
	);

	return useMemo(() => {
		const board = boards.find((b) => b.id === boardId);
		if (!board) {
			return { objectId: null, object: null };
		}

		const objectId = selectedObjectIds[boardId] ?? null;
		if (!objectId || !board.boardData) {
			return { objectId: null, object: null };
		}

		const object =
			board.boardData.objects.find((o) => o.id === objectId) ?? null;
		return { objectId, object };
	}, [boards, boardId, selectedObjectIds]);
}

export function useHasMultipleBoards(): boolean {
	return useViewerSelector((state) => state.boards.length > 1);
}

export function useIsBoardLimitReached(): boolean {
	return useViewerSelector((state) => state.boards.length >= MAX_BOARDS);
}
