/**
 * Dialog for board decode failures
 */

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
	open: boolean;
	boardName: string;
	onClose: () => void;
	onDelete: () => void;
	onOpenAnother: () => void;
}

export function DecodeErrorDialog({
	open,
	boardName,
	onClose,
	onDelete,
	onOpenAnother,
}: DecodeErrorDialogProps) {
	const { t } = useTranslation();

	return (
		<Dialog open={open} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
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
					<Button onClick={onDelete} variant="destructive" className="w-full">
						{t("boardManager.error.deleteAndContinue")}
					</Button>
					<Button onClick={onOpenAnother} variant="outline" className="w-full">
						{t("boardManager.error.openAnother")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
