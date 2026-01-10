import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ViewerBoard } from "@/lib/viewer";

interface ViewerTabsProps {
	boards: ViewerBoard[];
	activeId: string | null;
	onSelectTab: (id: string) => void;
	onCloseTab: (id: string) => void;
}

export function ViewerTabs({
	boards,
	activeId,
	onSelectTab,
	onCloseTab,
}: ViewerTabsProps) {
	const { t } = useTranslation();

	if (boards.length <= 1) {
		return null;
	}

	return (
		<div className="flex items-center gap-1 overflow-x-auto border-b border-border pb-2 mb-4">
			{boards.map((board, index) => (
				<div
					key={board.id}
					className={cn(
						"group flex items-center gap-1 px-3 py-1.5 rounded-t-lg border border-b-0 cursor-pointer transition-colors min-w-0",
						board.id === activeId
							? "bg-card border-border text-foreground"
							: "bg-muted/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
						board.error && "text-destructive",
					)}
					onClick={() => onSelectTab(board.id)}
					role="tab"
					aria-selected={board.id === activeId}
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							onSelectTab(board.id);
						}
					}}
				>
					<span className="text-sm truncate max-w-[120px]" title={board.name}>
						{board.name ||
							t("viewer.multiBoard.defaultName", { index: index + 1 })}
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
							onCloseTab(board.id);
						}}
						title={t("viewer.multiBoard.closeTab")}
					>
						<X className="size-3" />
					</button>
				</div>
			))}
		</div>
	);
}
