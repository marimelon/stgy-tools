import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { ViewerBoard } from "@/lib/viewer";
import { ViewerGridCard } from "./ViewerGridCard";

interface ViewerGridProps {
	boards: ViewerBoard[];
	onSelectBoard: (id: string) => void;
	onCloseBoard: (id: string) => void;
	onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function ViewerGrid({
	boards,
	onSelectBoard,
	onCloseBoard,
	onReorder,
}: ViewerGridProps) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	if (boards.length === 0) {
		return null;
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id && onReorder) {
			const oldIndex = boards.findIndex((b) => b.id === active.id);
			const newIndex = boards.findIndex((b) => b.id === over.id);
			if (oldIndex !== -1 && newIndex !== -1) {
				// Preserve scroll position across reorder (dnd-kit and TanStack Router may reset it)
				const scrollX = window.scrollX;
				const scrollY = window.scrollY;
				onReorder(oldIndex, newIndex);
				// Monitor and restore scroll position for a period after reorder
				const handleScroll = () => {
					if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
						window.scrollTo(scrollX, scrollY);
					}
				};
				window.addEventListener("scroll", handleScroll);
				setTimeout(() => {
					window.removeEventListener("scroll", handleScroll);
				}, 500);
			}
		}
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
			accessibility={{ restoreFocus: false }}
		>
			<SortableContext
				items={boards.map((b) => b.id)}
				strategy={rectSortingStrategy}
			>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{boards.map((board, index) => (
						<ViewerGridCard
							key={board.id}
							board={board}
							index={index}
							onClick={() => onSelectBoard(board.id)}
							onClose={() => onCloseBoard(board.id)}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
