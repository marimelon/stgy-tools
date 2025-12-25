/**
 * 重複ボード検出モーダルコンポーネント
 * Viewer や Image Generator から Editor を開く際に、
 * 同じ stgy コードのボードが既に存在する場合に表示
 */

import { Calendar, FolderOpen, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { StoredBoard } from "@/lib/boards/schema";

/**
 * DuplicateBoardModal の Props
 */
export interface DuplicateBoardModalProps {
	/** モーダルの開閉状態 */
	open: boolean;
	/** 閉じる時のコールバック */
	onClose: () => void;
	/** 既存のボード情報 */
	existingBoard: StoredBoard;
	/** 既存ボードを開く時のコールバック */
	onOpenExisting: () => void;
	/** 新規作成する時のコールバック */
	onCreateNew: () => void;
}

/**
 * 重複ボード検出モーダル
 */
export function DuplicateBoardModal({
	open,
	onClose,
	existingBoard,
	onOpenExisting,
	onCreateNew,
}: DuplicateBoardModalProps) {
	const { t, i18n } = useTranslation();

	// 日時フォーマット
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString(i18n.language === "ja" ? "ja-JP" : "en-US", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-display">
						{t("duplicateBoard.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<p className="text-sm text-muted-foreground">
						{t("duplicateBoard.description")}
					</p>

					{/* 既存ボード情報 */}
					<div className="rounded-md border bg-muted/50 p-3 space-y-2">
						<div className="flex items-center gap-2 text-sm">
							<span className="text-muted-foreground">
								{t("duplicateBoard.boardName")}:
							</span>
							<span className="font-medium truncate">{existingBoard.name}</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<Calendar className="size-3.5 text-muted-foreground" />
							<span className="text-muted-foreground">
								{t("duplicateBoard.updatedAt")}:
							</span>
							<span>{formatDate(existingBoard.updatedAt)}</span>
						</div>
					</div>

					{/* 選択肢 */}
					<div className="space-y-2">
						{/* 既存ボードを開く */}
						<button
							type="button"
							onClick={onOpenExisting}
							className="w-full flex items-start gap-3 p-3 rounded-md border hover:bg-accent transition-colors text-left"
						>
							<FolderOpen className="size-5 text-primary mt-0.5 shrink-0" />
							<div className="space-y-0.5">
								<div className="font-medium text-sm">
									{t("duplicateBoard.openExisting")}
								</div>
								<div className="text-xs text-muted-foreground">
									{t("duplicateBoard.openExistingDescription")}
								</div>
							</div>
						</button>

						{/* 新規作成 */}
						<button
							type="button"
							onClick={onCreateNew}
							className="w-full flex items-start gap-3 p-3 rounded-md border hover:bg-accent transition-colors text-left"
						>
							<Plus className="size-5 text-muted-foreground mt-0.5 shrink-0" />
							<div className="space-y-0.5">
								<div className="font-medium text-sm">
									{t("duplicateBoard.createNew")}
								</div>
								<div className="text-xs text-muted-foreground">
									{t("duplicateBoard.createNewDescription")}
								</div>
							</div>
						</button>
					</div>
				</div>

				<DialogFooter>
					<Button variant="ghost" onClick={onClose}>
						{t("duplicateBoard.cancel")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
