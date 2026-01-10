/**
 * Create Folder Dialog component
 */

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateFolderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreateFolder: (name: string) => void;
}

export function CreateFolderDialog({
	open,
	onOpenChange,
	onCreateFolder,
}: CreateFolderDialogProps) {
	const { t } = useTranslation();
	const [folderName, setFolderName] = useState("");
	const inputId = useId();

	const handleCreate = () => {
		const trimmedName = folderName.trim();
		if (trimmedName) {
			onCreateFolder(trimmedName);
			setFolderName("");
			onOpenChange(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleCreate();
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("boardManager.folder.newFolder")}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor={inputId}>
							{t("boardManager.folder.folderName")}
						</Label>
						<Input
							id={inputId}
							value={folderName}
							onChange={(e) => setFolderName(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={t("boardManager.folder.defaultFolderName")}
							autoFocus
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button onClick={handleCreate} disabled={!folderName.trim()}>
						{t("common.create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
