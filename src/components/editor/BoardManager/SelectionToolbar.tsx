/**
 * Selection toolbar component for batch operations on selected boards
 */

import { Copy, Folder, FolderOutput, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StoredFolder } from "@/lib/boards";

export interface SelectionToolbarProps {
	selectedCount: number;
	folders: StoredFolder[];
	onClear: () => void;
	onDelete: () => void;
	onDuplicate: () => void;
	onMoveToFolder: (folderId: string | null) => void;
}

export function SelectionToolbar({
	selectedCount,
	folders,
	onClear,
	onDelete,
	onDuplicate,
	onMoveToFolder,
}: SelectionToolbarProps) {
	const { t } = useTranslation();

	if (selectedCount === 0) return null;

	return (
		<div className="shrink-0 bg-background border-t p-3 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
			<span className="text-sm text-muted-foreground">
				{t("boardManager.selection.selectedCount", { count: selectedCount })}
			</span>
			<div className="flex items-center gap-2">
				<Button variant="outline" size="sm" onClick={onClear}>
					<X className="size-4 mr-2" />
					{t("boardManager.selection.clearSelection")}
				</Button>

				{folders.length > 0 && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm">
								<Folder className="size-4 mr-2" />
								{t("boardManager.selection.moveToFolder")}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onMoveToFolder(null)}>
								<FolderOutput className="size-4 mr-2" />
								{t("boardManager.folder.moveToRoot")}
							</DropdownMenuItem>
							{folders.map((folder) => (
								<DropdownMenuItem
									key={folder.id}
									onClick={() => onMoveToFolder(folder.id)}
								>
									<Folder className="size-4 mr-2" />
									{folder.name}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				)}

				<Button variant="outline" size="sm" onClick={onDuplicate}>
					<Copy className="size-4 mr-2" />
					{t("boardManager.selection.duplicate")}
				</Button>

				<Button variant="destructive" size="sm" onClick={onDelete}>
					<Trash2 className="size-4 mr-2" />
					{t("boardManager.selection.delete")}
				</Button>
			</div>
		</div>
	);
}
