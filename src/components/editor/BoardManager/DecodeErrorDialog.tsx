/**
 * Dialog for board decode failures
 * @ebay/nice-modal-react + Radix Dialog ベース
 */

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export interface DecodeErrorDialogProps {
	boardName: string;
}

/**
 * モーダルの結果
 */
export type DecodeErrorResult = "delete" | "open-another" | undefined;

/**
 * DecodeErrorDialog
 *
 * resolve("delete") - 削除して続行
 * resolve("open-another") - 別のボードを開く
 * resolve(undefined) - キャンセル
 */
export const DecodeErrorDialog = NiceModal.create(
	({ boardName }: DecodeErrorDialogProps) => {
		const { t } = useTranslation();
		const modal = useModal();

		const handleClose = () => {
			modal.resolve(undefined);
			modal.hide();
		};

		const handleDelete = () => {
			modal.resolve("delete" satisfies DecodeErrorResult);
			modal.hide();
		};

		const handleOpenAnother = () => {
			modal.resolve("open-another" satisfies DecodeErrorResult);
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
						<div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
							<AlertTriangle className="size-6 text-destructive" />
						</div>
						<DialogTitle className="text-center">
							{t("boardManager.error.decodeFailed.title")}
						</DialogTitle>
						<DialogDescription className="text-center">
							{t("boardManager.error.decodeFailed.description", {
								name: boardName,
							})}
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="flex-col gap-2 sm:flex-col">
						<Button
							onClick={handleDelete}
							variant="destructive"
							className="w-full"
						>
							{t("boardManager.error.deleteAndContinue")}
						</Button>
						<Button
							onClick={handleOpenAnother}
							variant="outline"
							className="w-full"
						>
							{t("boardManager.error.openAnother")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);
