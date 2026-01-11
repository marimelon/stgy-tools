import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Copy, GripVertical, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { BoardViewer } from "@/components/board";
import { cn } from "@/lib/utils";
import type { ViewerBoard } from "@/lib/viewer";

interface ViewerGridCardProps {
	board: ViewerBoard;
	index: number;
	onClick: () => void;
	onClose: () => void;
}

export function ViewerGridCard({
	board,
	index,
	onClick,
	onClose,
}: ViewerGridCardProps) {
	const { t } = useTranslation();
	const [copied, setCopied] = useState(false);

	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: board.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const handleCopyCode = useCallback(
		async (e: React.MouseEvent) => {
			e.stopPropagation();
			if (!board.stgyCode) return;
			try {
				await navigator.clipboard.writeText(board.stgyCode);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} catch {
				// クリップボードAPIが利用できない場合は何もしない
			}
		},
		[board.stgyCode],
	);

	return (
		// biome-ignore lint/a11y/useSemanticElements: 内部にBoardViewerを含むため、buttonではなくdivを使用
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"group relative border rounded-lg overflow-hidden cursor-pointer transition-all border-border hover:border-primary/50",
				board.error && "border-destructive/50",
				isDragging && "opacity-50 shadow-lg z-10",
			)}
			onClick={onClick}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onClick();
				}
			}}
			data-testid="viewer-grid-card"
			{...attributes}
			role="button"
			tabIndex={0}
		>
			{/* サムネイル */}
			<div className="aspect-[4/3] bg-muted pointer-events-none">
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

			{/* ドラッグハンドル（左上） */}
			<div
				ref={setActivatorNodeRef}
				className="absolute top-2 left-2 p-1 bg-background/80 hover:bg-muted rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
				title={t("viewer.multiBoard.dragToReorder")}
				aria-label={t("viewer.multiBoard.dragToReorder")}
				{...listeners}
			>
				<GripVertical className="size-4 text-muted-foreground" />
			</div>

			{/* ホバー時のアクションボタン（右上） */}
			<div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				{/* コピーボタン */}
				{board.stgyCode && (
					<button
						type="button"
						className="p-1 bg-background/80 hover:bg-primary/20 rounded transition-colors"
						onClick={handleCopyCode}
						title={t("boardManager.copyStgyCode")}
					>
						{copied ? (
							<Check className="size-4 text-primary" />
						) : (
							<Copy className="size-4" />
						)}
					</button>
				)}
				{/* 閉じるボタン */}
				<button
					type="button"
					className="p-1 bg-background/80 hover:bg-destructive/20 rounded transition-colors"
					onClick={(e) => {
						e.stopPropagation();
						onClose();
					}}
					title={t("viewer.multiBoard.closeTab")}
				>
					<X className="size-4" />
				</button>
			</div>
		</div>
	);
}
