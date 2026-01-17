/**
 * Board grid component for displaying board cards
 */

import type { StoredBoard, StoredFolder } from "@/lib/boards";
import { BoardCard } from "./BoardCard";
import { EmptyState } from "./EmptyState";

export interface BoardGridProps {
	boards: StoredBoard[];
	currentBoardId: string | null;
	selectedBoardIds?: Set<string>;
	isSelectionMode?: boolean;
	isLoading: boolean;
	searchQuery: string;
	onOpenBoard: (id: string) => void;
	onSelectBoard?: (id: string, additive: boolean, range: boolean) => void;
	onRenameBoard: (id: string, newName: string) => void;
	onDuplicateBoard: (id: string) => void;
	onDeleteBoard: (id: string) => void;
	onCreateNew?: () => void;
	onMoveToFolder?: (boardId: string, folderId: string | null) => void;
	folders?: StoredFolder[];
	currentFolderId?: string | null;
}

export function BoardGrid({
	boards,
	currentBoardId,
	selectedBoardIds,
	isSelectionMode = false,
	isLoading,
	searchQuery,
	onOpenBoard,
	onSelectBoard,
	onRenameBoard,
	onDuplicateBoard,
	onDeleteBoard,
	onCreateNew,
	onMoveToFolder,
	folders,
	currentFolderId,
}: BoardGridProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (boards.length === 0 && onCreateNew) {
		return (
			<EmptyState hasSearchQuery={!!searchQuery} onCreateNew={onCreateNew} />
		);
	}

	if (boards.length === 0) {
		return null;
	}

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
			{boards.map((board) => (
				<BoardCard
					key={board.id}
					board={board}
					isCurrent={board.id === currentBoardId}
					isSelected={selectedBoardIds?.has(board.id) ?? false}
					isSelectionMode={isSelectionMode}
					onOpen={() => onOpenBoard(board.id)}
					onSelect={
						onSelectBoard
							? (additive, range) => onSelectBoard(board.id, additive, range)
							: undefined
					}
					onRename={(newName) => onRenameBoard(board.id, newName)}
					onDuplicate={() => onDuplicateBoard(board.id)}
					onDelete={() => onDeleteBoard(board.id)}
					onMoveToFolder={
						onMoveToFolder
							? (folderId) => onMoveToFolder(board.id, folderId)
							: undefined
					}
					folders={folders}
					currentFolderId={currentFolderId}
				/>
			))}
		</div>
	);
}
