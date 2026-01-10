/**
 * Folder Section component
 * Displays a folder with its header and contained boards
 */

import { useTranslation } from "react-i18next";
import type { StoredBoard, StoredFolder } from "@/lib/boards";
import { BoardGrid } from "./BoardGrid";
import { FolderHeader } from "./FolderHeader";

interface FolderSectionProps {
	folder: StoredFolder;
	boards: StoredBoard[];
	currentBoardId: string | null;
	onToggleCollapse: () => void;
	onRenameFolder: (newName: string) => void;
	onDeleteFolder: () => void;
	onOpenInViewer?: () => void;
	onOpenAllInEditor?: () => void;
	onOpenBoard: (id: string) => void;
	onRenameBoard: (id: string, newName: string) => void;
	onDuplicateBoard: (id: string) => void;
	onDeleteBoard: (id: string) => void;
	onMoveToFolder: (boardId: string, folderId: string | null) => void;
	allFolders: StoredFolder[];
	/** Drag handlers for folder reordering */
	onFolderDragStart?: (e: React.DragEvent) => void;
	onFolderDragOver?: (e: React.DragEvent) => void;
	onFolderDragLeave?: (e: React.DragEvent) => void;
	onFolderDrop?: (e: React.DragEvent) => void;
	isFolderDragOver?: boolean;
	/** Drag handlers for board drop */
	onBoardDragOver?: (e: React.DragEvent) => void;
	onBoardDrop?: (e: React.DragEvent) => void;
	isBoardDragOver?: boolean;
}

export function FolderSection({
	folder,
	boards,
	currentBoardId,
	onToggleCollapse,
	onRenameFolder,
	onDeleteFolder,
	onOpenInViewer,
	onOpenAllInEditor,
	onOpenBoard,
	onRenameBoard,
	onDuplicateBoard,
	onDeleteBoard,
	onMoveToFolder,
	allFolders,
	onFolderDragStart,
	onFolderDragOver,
	onFolderDragLeave,
	onFolderDrop,
	isFolderDragOver,
	onBoardDragOver,
	onBoardDrop,
	isBoardDragOver,
}: FolderSectionProps) {
	const { t } = useTranslation();

	return (
		<div className="space-y-2">
			<FolderHeader
				folder={folder}
				boardCount={boards.length}
				onToggleCollapse={onToggleCollapse}
				onRename={onRenameFolder}
				onDelete={onDeleteFolder}
				onOpenInViewer={onOpenInViewer}
				onOpenAllInEditor={onOpenAllInEditor}
				onDragStart={onFolderDragStart}
				onDragOver={onFolderDragOver}
				onDragLeave={onFolderDragLeave}
				onDrop={onFolderDrop}
				isDragOver={isFolderDragOver}
			/>

			{!folder.collapsed && (
				// biome-ignore lint/a11y/noStaticElementInteractions: Drop target for drag and drop
				<div
					className={`ml-6 pl-4 border-l-2 transition-colors ${
						isBoardDragOver ? "border-primary" : "border-muted"
					}`}
					onDragOver={onBoardDragOver}
					onDrop={onBoardDrop}
					onDragEnter={(e) => e.preventDefault()}
				>
					{boards.length > 0 ? (
						<BoardGrid
							boards={boards}
							currentBoardId={currentBoardId}
							isLoading={false}
							searchQuery=""
							onOpenBoard={onOpenBoard}
							onRenameBoard={onRenameBoard}
							onDuplicateBoard={onDuplicateBoard}
							onDeleteBoard={onDeleteBoard}
							onMoveToFolder={onMoveToFolder}
							folders={allFolders}
							currentFolderId={folder.id}
						/>
					) : (
						<div className="py-8 text-center text-sm text-muted-foreground">
							{t("boardManager.folder.emptyFolder")}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
