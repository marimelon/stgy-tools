import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
	horizontalListSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ViewerBoard } from "@/lib/viewer";

interface ViewerTabsProps {
	boards: ViewerBoard[];
	activeId: string | null;
	onSelectTab: (id: string) => void;
	onCloseTab: (id: string) => void;
	onReorder?: (fromIndex: number, toIndex: number) => void;
}

interface SortableTabProps {
	board: ViewerBoard;
	index: number;
	isActive: boolean;
	onSelect: () => void;
	onClose: () => void;
}

function SortableTab({
	board,
	index,
	isActive,
	onSelect,
	onClose,
}: SortableTabProps) {
	const { t } = useTranslation();
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: board.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"group flex items-center gap-1 px-3 py-1.5 rounded-t-lg border border-b-0 cursor-grab transition-colors min-w-0",
				isActive
					? "bg-card border-border text-foreground"
					: "bg-muted/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
				board.error && "text-destructive",
				isDragging && "opacity-50 shadow-lg z-10",
			)}
			onClick={onSelect}
			aria-selected={isActive}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onSelect();
				}
			}}
			{...attributes}
			{...listeners}
			role="tab"
			tabIndex={0}
		>
			<span className="text-sm truncate max-w-[120px]" title={board.name}>
				{board.name || t("viewer.multiBoard.defaultName", { index: index + 1 })}
			</span>
			{board.error && (
				<span className="text-xs text-destructive" title={board.error}>
					⚠
				</span>
			)}
			<button
				type="button"
				className="ml-1 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-opacity"
				onClick={(e) => {
					e.stopPropagation();
					onClose();
				}}
				title={t("viewer.multiBoard.closeTab")}
			>
				<X className="size-3" />
			</button>
		</div>
	);
}

export function ViewerTabs({
	boards,
	activeId,
	onSelectTab,
	onCloseTab,
	onReorder,
}: ViewerTabsProps) {
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

	if (boards.length <= 1) {
		return null;
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id && onReorder) {
			const oldIndex = boards.findIndex((b) => b.id === active.id);
			const newIndex = boards.findIndex((b) => b.id === over.id);
			if (oldIndex !== -1 && newIndex !== -1) {
				onReorder(oldIndex, newIndex);
			}
		}
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToHorizontalAxis]}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={boards.map((b) => b.id)}
				strategy={horizontalListSortingStrategy}
			>
				<div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-2 mb-4">
					{boards.map((board, index) => (
						<SortableTab
							key={board.id}
							board={board}
							index={index}
							isActive={board.id === activeId}
							onSelect={() => onSelectTab(board.id)}
							onClose={() => onCloseTab(board.id)}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
