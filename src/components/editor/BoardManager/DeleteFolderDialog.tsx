/**
 * Delete Folder Confirmation Dialog component
 */

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

interface DeleteFolderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	folderName: string;
	boardCount: number;
	onConfirm: () => void;
}

export function DeleteFolderDialog({
	open,
	onOpenChange,
	folderName,
	boardCount,
	onConfirm,
}: DeleteFolderDialogProps) {
	const { t } = useTranslation();

	const handleConfirm = () => {
		onConfirm();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{t("boardManager.folder.deleteTitle", { name: folderName })}
					</DialogTitle>
					<DialogDescription>
						{boardCount > 0
							? t("boardManager.folder.deleteConfirmWithBoards", {
									count: boardCount,
								})
							: t("boardManager.folder.deleteConfirmEmpty")}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button variant="destructive" onClick={handleConfirm}>
						{t("common.delete")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
