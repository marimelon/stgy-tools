/**
 * Duplicate board detection modal
 * Based on @ebay/nice-modal-react + Radix Dialog
 *
 * Shown when opening Editor from Viewer or Image Generator
 * if a board with the same stgy code already exists
 */

import NiceModal, { useModal } from "@ebay/nice-modal-react";
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

export interface DuplicateBoardModalProps {
	existingBoard: StoredBoard;
}

export type DuplicateBoardResult = "open-existing" | "create-new" | undefined;

/**
 * Duplicate board detection modal
 *
 * resolve("open-existing") - Open existing board
 * resolve("create-new") - Create new board
 * resolve(undefined) - Cancel
 */
export const DuplicateBoardModal = NiceModal.create(
	({ existingBoard }: DuplicateBoardModalProps) => {
		const { t, i18n } = useTranslation();
		const modal = useModal();

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

		const handleClose = () => {
			modal.resolve(undefined);
			modal.hide();
		};

		const handleOpenExisting = () => {
			modal.resolve("open-existing" satisfies DuplicateBoardResult);
			modal.hide();
		};

		const handleCreateNew = () => {
			modal.resolve("create-new" satisfies DuplicateBoardResult);
			modal.hide();
		};

		return (
			<Dialog
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) handleClose();
				}}
			>
				<DialogContent
					className="sm:max-w-md"
					onCloseAutoFocus={() => modal.remove()}
				>
					<DialogHeader>
						<DialogTitle className="font-display">
							{t("duplicateBoard.title")}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							{t("duplicateBoard.description")}
						</p>

						<div className="rounded-md border bg-muted/50 p-3 space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<span className="text-muted-foreground">
									{t("duplicateBoard.boardName")}:
								</span>
								<span className="font-medium truncate">
									{existingBoard.name}
								</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<Calendar className="size-3.5 text-muted-foreground" />
								<span className="text-muted-foreground">
									{t("duplicateBoard.updatedAt")}:
								</span>
								<span>{formatDate(existingBoard.updatedAt)}</span>
							</div>
						</div>

						<div className="space-y-2">
							<button
								type="button"
								onClick={handleOpenExisting}
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

							<button
								type="button"
								onClick={handleCreateNew}
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
						<Button variant="ghost" onClick={handleClose}>
							{t("duplicateBoard.cancel")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);
