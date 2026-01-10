import type { ViewerBoard } from "@/lib/viewer";
import { ViewerGridCard } from "./ViewerGridCard";

interface ViewerGridProps {
	boards: ViewerBoard[];
	activeId: string | null;
	onSelectBoard: (id: string) => void;
	onCloseBoard: (id: string) => void;
}

export function ViewerGrid({
	boards,
	activeId,
	onSelectBoard,
	onCloseBoard,
}: ViewerGridProps) {
	if (boards.length === 0) {
		return null;
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{boards.map((board, index) => (
				<ViewerGridCard
					key={board.id}
					board={board}
					index={index}
					isActive={board.id === activeId}
					onClick={() => onSelectBoard(board.id)}
					onClose={() => onCloseBoard(board.id)}
				/>
			))}
		</div>
	);
}
