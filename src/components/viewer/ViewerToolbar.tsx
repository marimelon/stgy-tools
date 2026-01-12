import {
	Check,
	FolderPlus,
	LayoutGrid,
	LayoutList,
	Link,
	Loader2,
	Pencil,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ViewerMode } from "@/lib/viewer";

interface ViewerToolbarProps {
	viewMode: ViewerMode;
	onViewModeChange: (mode: ViewerMode) => void;
	boardCount: number;
	onGenerateShortLink?: () => void;
	isGeneratingShortLink?: boolean;
	copiedShortLink?: boolean;
	shortLinksEnabled?: boolean;
	onEditAllInEditor?: () => void;
	onCreateGroup?: () => void;
	isGroupView?: boolean;
}

export function ViewerToolbar({
	viewMode,
	onViewModeChange,
	boardCount,
	onGenerateShortLink,
	isGeneratingShortLink,
	copiedShortLink,
	shortLinksEnabled,
	onEditAllInEditor,
	onCreateGroup,
	isGroupView,
}: ViewerToolbarProps) {
	const { t } = useTranslation();

	if (boardCount <= 1) {
		return null;
	}

	return (
		<div className="flex items-center justify-between mb-4">
			<span className="text-sm text-muted-foreground">
				{t("viewer.multiBoard.boardCount", { count: boardCount })}
			</span>
			<div className="flex items-center gap-2">
				{shortLinksEnabled && onCreateGroup && !isGroupView && (
					<button
						type="button"
						className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border hover:border-border rounded-lg transition-all"
						onClick={onCreateGroup}
						title={t("viewer.group.createTitle")}
					>
						<FolderPlus className="size-4" />
						<span className="hidden sm:inline">
							{t("viewer.group.createButton")}
						</span>
					</button>
				)}
				{shortLinksEnabled && onGenerateShortLink && !isGroupView && (
					<button
						type="button"
						className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={onGenerateShortLink}
						disabled={isGeneratingShortLink}
						title={t("viewer.multiBoard.share")}
					>
						{isGeneratingShortLink ? (
							<Loader2 className="size-4 animate-spin" />
						) : copiedShortLink ? (
							<Check className="size-4" />
						) : (
							<Link className="size-4" />
						)}
						<span className="hidden sm:inline">
							{copiedShortLink
								? t("viewer.shortLink.copied")
								: t("viewer.multiBoard.share")}
						</span>
					</button>
				)}
				{onEditAllInEditor && (
					<button
						type="button"
						className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 rounded-lg transition-all"
						onClick={onEditAllInEditor}
						title={t("imageGenerator.editInEditor")}
					>
						<Pencil className="size-4" />
						<span className="hidden sm:inline">
							{t("imageGenerator.editInEditor")}
						</span>
					</button>
				)}
				<div className="flex items-center border border-border rounded-lg overflow-hidden">
					<button
						type="button"
						className={cn(
							"flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
							viewMode === "tab"
								? "bg-primary text-primary-foreground"
								: "bg-background hover:bg-muted text-muted-foreground hover:text-foreground",
						)}
						onClick={() => onViewModeChange("tab")}
						title={t("viewer.multiBoard.tabMode")}
					>
						<LayoutList className="size-4" />
						<span className="hidden sm:inline">
							{t("viewer.multiBoard.tabMode")}
						</span>
					</button>
					<button
						type="button"
						className={cn(
							"flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
							viewMode === "grid"
								? "bg-primary text-primary-foreground"
								: "bg-background hover:bg-muted text-muted-foreground hover:text-foreground",
						)}
						onClick={() => onViewModeChange("grid")}
						title={t("viewer.multiBoard.gridMode")}
					>
						<LayoutGrid className="size-4" />
						<span className="hidden sm:inline">
							{t("viewer.multiBoard.gridMode")}
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
