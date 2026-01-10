/**
 * Board Manager Modal component
 * @ebay/nice-modal-react + Radix Dialog ベース
 */

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { ArrowUpDown, FolderPlus, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { type BoardSortOption, useBoards, useFolders } from "@/lib/boards";
import { BoardGrid } from "./BoardGrid";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { FolderSection } from "./FolderSection";
import { UndoToast } from "./UndoToast";

export interface BoardManagerModalProps {
	currentBoardId: string | null;
	onOpenBoard: (id: string) => void;
	onOpenBoards?: (ids: string[]) => void;
	onCreateNewBoard: () => void;
}

export const BoardManagerModal = NiceModal.create(
	({
		currentBoardId,
		onOpenBoard,
		onOpenBoards,
		onCreateNewBoard,
	}: BoardManagerModalProps) => {
		const { t } = useTranslation();
		const modal = useModal();
		const [searchQuery, setSearchQuery] = useState("");
		const [sortBy, setSortBy] = useState<BoardSortOption>("updatedAt");
		const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);

		const {
			boards,
			isLoading: isBoardsLoading,
			updateBoard,
			deleteBoard,
			duplicateBoard,
			moveBoardToFolder,
			getBoardsByFolder,
			deletedBoard,
			undoDelete,
			dismissUndo,
		} = useBoards({
			sortBy,
			sortDirection: "desc",
			searchQuery,
		});

		const {
			folders,
			isLoading: isFoldersLoading,
			createFolder,
			updateFolder,
			deleteFolder: deleteFolderFromDB,
			toggleCollapsed,
		} = useFolders();

		const isLoading = isBoardsLoading || isFoldersLoading;

		const handleClose = () => {
			modal.hide();
		};

		const handleOpenBoard = (id: string) => {
			onOpenBoard(id);
			handleClose();
		};

		const handleRenameBoard = (id: string, newName: string) => {
			updateBoard(id, { name: newName });
		};

		const handleDuplicateBoard = (id: string) => {
			duplicateBoard(id);
		};

		const handleDeleteBoard = (id: string) => {
			deleteBoard(id);

			if (id === currentBoardId) {
				const remainingBoards = boards.filter((b) => b.id !== id);
				if (remainingBoards.length > 0) {
					onOpenBoard(remainingBoards[0].id);
				} else {
					onCreateNewBoard();
				}
			}
		};

		const handleCreateNew = () => {
			onCreateNewBoard();
			handleClose();
		};

		const handleCreateFolder = async (name: string) => {
			await createFolder(name);
		};

		const handleRenameFolder = (folderId: string, newName: string) => {
			updateFolder(folderId, { name: newName });
		};

		const handleDeleteFolder = async (folderId: string) => {
			// Move all boards in the folder to root
			const boardsInFolder = getBoardsByFolder(folderId);
			await Promise.all(
				boardsInFolder.map((board) => moveBoardToFolder(board.id, null)),
			);
			// Delete the folder
			deleteFolderFromDB(folderId);
		};

		const handleMoveToFolder = (boardId: string, folderId: string | null) => {
			moveBoardToFolder(boardId, folderId);
		};

		const handleOpenFolderInViewer = (folderId: string) => {
			const boardsInFolder = getBoardsByFolder(folderId);
			if (boardsInFolder.length === 0) return;

			// Construct URL with multiple stgy params
			const url = new URL("/", window.location.origin);
			for (const board of boardsInFolder) {
				url.searchParams.append("stgy", board.stgyCode);
			}
			// Use grid mode for multiple boards
			if (boardsInFolder.length > 1) {
				url.searchParams.set("mode", "grid");
			}

			window.open(url.toString(), "_blank");
		};

		const handleOpenFolderInEditor = (folderId: string) => {
			if (!onOpenBoards) return;
			const boardsInFolder = getBoardsByFolder(folderId);
			if (boardsInFolder.length === 0) return;

			onOpenBoards(boardsInFolder.map((b) => b.id));
			handleClose();
		};

		// Get root boards (not in any folder)
		const rootBoards = getBoardsByFolder(null);

		const sortOptions: { value: BoardSortOption; label: string }[] = [
			{ value: "updatedAt", label: t("boardManager.sortByUpdated") },
			{ value: "createdAt", label: t("boardManager.sortByCreated") },
			{ value: "name", label: t("boardManager.sortByName") },
		];

		const currentSortLabel =
			sortOptions.find((opt) => opt.value === sortBy)?.label ?? "";

		return (
			<>
				<Dialog
					open={modal.visible}
					onOpenChange={(open) => {
						if (!open) handleClose();
					}}
				>
					<DialogContent
						className="sm:max-w-2xl md:max-w-4xl h-[90vh] flex flex-col"
						onCloseAutoFocus={() => modal.remove()}
					>
						<DialogHeader>
							<DialogTitle className="font-display">
								{t("boardManager.title")}
							</DialogTitle>
						</DialogHeader>

						{/* Toolbar */}
						<div className="flex items-center gap-2 flex-wrap">
							{/* Search */}
							<div className="relative flex-1 min-w-[200px]">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									type="text"
									placeholder={t("boardManager.search")}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>

							{/* Sort */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm">
										<ArrowUpDown className="size-4 mr-2" />
										{currentSortLabel}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{sortOptions.map((option) => (
										<DropdownMenuItem
											key={option.value}
											onClick={() => setSortBy(option.value)}
										>
											{option.label}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							{/* New folder button */}
							<Button
								variant="outline"
								onClick={() => setShowCreateFolderDialog(true)}
							>
								<FolderPlus className="size-4 mr-2" />
								{t("boardManager.folder.newFolder")}
							</Button>

							{/* New board button */}
							<Button onClick={handleCreateNew}>
								<Plus className="size-4 mr-2" />
								{t("boardManager.newBoard")}
							</Button>
						</div>

						{/* Folders and Board grid */}
						<div className="flex-1 overflow-y-auto mt-4 space-y-4">
							{/* Folders */}
							{folders
								.filter((folder) => {
									// Hide folders with no matching boards during search
									if (!searchQuery) return true;
									return getBoardsByFolder(folder.id).length > 0;
								})
								.map((folder) => (
									<FolderSection
										key={folder.id}
										folder={folder}
										boards={getBoardsByFolder(folder.id)}
										currentBoardId={currentBoardId}
										onToggleCollapse={() => toggleCollapsed(folder.id)}
										onRenameFolder={(newName) =>
											handleRenameFolder(folder.id, newName)
										}
										onDeleteFolder={() => handleDeleteFolder(folder.id)}
										onOpenInViewer={() => handleOpenFolderInViewer(folder.id)}
										onOpenAllInEditor={
											onOpenBoards
												? () => handleOpenFolderInEditor(folder.id)
												: undefined
										}
										onOpenBoard={handleOpenBoard}
										onRenameBoard={handleRenameBoard}
										onDuplicateBoard={handleDuplicateBoard}
										onDeleteBoard={handleDeleteBoard}
										onMoveToFolder={handleMoveToFolder}
										allFolders={folders}
									/>
								))}

							{/* Root boards (not in any folder) */}
							{(folders.length === 0 || rootBoards.length > 0) && (
								<BoardGrid
									boards={rootBoards}
									currentBoardId={currentBoardId}
									isLoading={isLoading}
									searchQuery={searchQuery}
									onOpenBoard={handleOpenBoard}
									onRenameBoard={handleRenameBoard}
									onDuplicateBoard={handleDuplicateBoard}
									onDeleteBoard={handleDeleteBoard}
									onCreateNew={handleCreateNew}
									onMoveToFolder={handleMoveToFolder}
									folders={folders}
									currentFolderId={null}
								/>
							)}
						</div>

						{/* Board count */}
						<div className="text-xs text-muted-foreground pt-2 border-t">
							{searchQuery
								? t("boardManager.boardCountFiltered", { count: boards.length })
								: t("boardManager.boardCount", { count: boards.length })}
						</div>
					</DialogContent>
				</Dialog>

				{/* Undo toast */}
				{deletedBoard && (
					<UndoToast
						boardName={deletedBoard.name}
						onUndo={undoDelete}
						onDismiss={dismissUndo}
					/>
				)}

				{/* Create folder dialog */}
				<CreateFolderDialog
					open={showCreateFolderDialog}
					onOpenChange={setShowCreateFolderDialog}
					onCreateFolder={handleCreateFolder}
				/>
			</>
		);
	},
);
