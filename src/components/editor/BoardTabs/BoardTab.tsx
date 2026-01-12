/**
 * Individual board tab component
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { TabInfo } from "./types";

/** Maximum width for tab text before truncation */
const MAX_TAB_WIDTH = 120;

interface BoardTabProps {
	tab: TabInfo;
	isActive: boolean;
	isOnlyTab: boolean;
	onSelect: () => void;
	onClose: () => void;
	onMiddleClick: () => void;
	onContextMenu: (e: React.MouseEvent) => void;
}

export function BoardTab({
	tab,
	isActive,
	isOnlyTab,
	onSelect,
	onClose,
	onMiddleClick,
	onContextMenu,
}: BoardTabProps) {
	const [isHovered, setIsHovered] = useState(false);

	// dnd-kit sortable hook
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: tab.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 50 : undefined,
	};

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			// Middle click to close
			if (e.button === 1) {
				e.preventDefault();
				onMiddleClick();
			}
		},
		[onMiddleClick],
	);

	const handleCloseClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onClose();
		},
		[onClose],
	);

	const showCloseButton = isHovered && !isOnlyTab;

	return (
		<div ref={setNodeRef} style={style} className="relative">
			<button
				type="button"
				className={cn(
					"relative flex items-center gap-1 px-3 py-1.5 text-sm border-t border-l border-r rounded-t-md",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
					"transition-[background-color,border-color,color,opacity]",
					"touch-none", // Prevent touch scrolling while dragging
					isActive
						? "bg-background border-border text-foreground -mb-px z-10"
						: "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
					isDragging && "opacity-50 shadow-lg",
				)}
				onClick={onSelect}
				onMouseDown={handleMouseDown}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onContextMenu={onContextMenu}
				{...attributes}
				{...listeners}
			>
				<span
					className="truncate"
					style={{ maxWidth: MAX_TAB_WIDTH }}
					title={tab.name}
				>
					{tab.name}
				</span>

				{/* Unsaved indicator */}
				{tab.hasUnsavedChanges && (
					<span className="text-primary" title="Unsaved changes">
						•
					</span>
				)}

				{/* Close button */}
				{showCloseButton && (
					<button
						type="button"
						tabIndex={-1}
						className="ml-1 p-0.5 rounded hover:bg-muted-foreground/20 transition-colors"
						onClick={handleCloseClick}
						onPointerDown={(e) => e.stopPropagation()}
					>
						<X className="size-3" />
					</button>
				)}
			</button>
		</div>
	);
}
