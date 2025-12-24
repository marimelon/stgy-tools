/**
 * Board grid component for displaying board cards
 */

import type { StoredBoard } from "@/lib/boards";
import { BoardCard } from "./BoardCard";
import { EmptyState } from "./EmptyState";

export interface BoardGridProps {
	boards: StoredBoard[];
	currentBoardId: string | null;
	isLoading: boolean;
	searchQuery: string;
	onOpenBoard: (id: string) => void;
	onRenameBoard: (id: string, newName: string) => void;
	onDuplicateBoard: (id: string) => void;
	onDeleteBoard: (id: string) => void;
	onCreateNew: () => void;
}

export function BoardGrid({
	boards,
	currentBoardId,
	isLoading,
	searchQuery,
	onOpenBoard,
	onRenameBoard,
	onDuplicateBoard,
	onDeleteBoard,
	onCreateNew,
}: BoardGridProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	if (boards.length === 0) {
		return (
			<EmptyState hasSearchQuery={!!searchQuery} onCreateNew={onCreateNew} />
		);
	}

	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
			{boards.map((board) => (
				<BoardCard
					key={board.id}
					board={board}
					isCurrent={board.id === currentBoardId}
					onOpen={() => onOpenBoard(board.id)}
					onRename={(newName) => onRenameBoard(board.id, newName)}
					onDuplicate={() => onDuplicateBoard(board.id)}
					onDelete={() => onDeleteBoard(board.id)}
				/>
			))}
		</div>
	);
}
