import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BoardViewer } from "@/components/board";
import { cn } from "@/lib/utils";
import type { ViewerBoard } from "@/lib/viewer";

interface ViewerGridCardProps {
	board: ViewerBoard;
	index: number;
	isActive: boolean;
	onClick: () => void;
	onClose: () => void;
}

export function ViewerGridCard({
	board,
	index,
	isActive,
	onClick,
	onClose,
}: ViewerGridCardProps) {
	const { t } = useTranslation();

	return (
		// biome-ignore lint/a11y/useSemanticElements: 内部にBoardViewerを含むため、buttonではなくdivを使用
		<div
			className={cn(
				"group relative border rounded-lg overflow-hidden cursor-pointer transition-all",
				isActive
					? "ring-2 ring-primary border-primary"
					: "border-border hover:border-primary/50",
				board.error && "border-destructive/50",
			)}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onClick();
				}
			}}
			role="button"
			tabIndex={0}
			data-testid="viewer-grid-card"
		>
			{/* サムネイル */}
			<div className="aspect-[4/3] bg-muted">
				{board.boardData ? (
					<BoardViewer boardData={board.boardData} responsive maxWidth={400} />
				) : (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						<span className="text-sm">
							{board.error ?? t("viewer.multiBoard.noData")}
						</span>
					</div>
				)}
			</div>

			{/* ボード名 */}
			<div className="p-2 bg-card border-t border-border">
				<div className="flex items-center justify-between gap-2">
					<span
						className={cn(
							"text-sm font-medium truncate",
							board.error && "text-destructive",
						)}
						title={board.name}
					>
						{board.name ||
							t("viewer.multiBoard.defaultName", { index: index + 1 })}
					</span>
					{board.error && (
						<span className="text-xs text-destructive" title={board.error}>
							⚠
						</span>
					)}
				</div>
			</div>

			{/* 閉じるボタン */}
			<button
				type="button"
				className="absolute top-2 right-2 p-1 bg-background/80 hover:bg-destructive/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
				onClick={(e) => {
					e.stopPropagation();
					onClose();
				}}
				title={t("viewer.multiBoard.closeTab")}
			>
				<X className="size-4" />
			</button>
		</div>
	);
}
