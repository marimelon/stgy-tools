/**
 * Board Manager Modal component
 * Based on @ebay/nice-modal-react + Radix Dialog
 */

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { ArrowUpDown, FolderPlus, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { FolderSection } from "./FolderSection";
import { SelectionToolbar } from "./SelectionToolbar";
import { UndoToast } from "./UndoToast";

export interface BoardManagerModalProps {
	currentBoardId: string | null;
	onOpenBoard: (id: string) => void;
	onOpenBoards?: (ids: string[]) => void;
	onCreateNewBoard: () => void;
	/** Called when boards are deleted to remove their tabs */
	onRemoveDeletedBoardTabs?: (deletedBoardIds: string[]) => void;
}

export const BoardManagerModal = NiceModal.create(
	({
		currentBoardId,
		onOpenBoard,
		onOpenBoards,
		onCreateNewBoard,
		onRemoveDeletedBoardTabs,
	}: BoardManagerModalProps) => {
		const { t } = useTranslation();
		const modal = useModal();
		const [searchQuery, setSearchQuery] = useState("");
		const [sortBy, setSortBy] = useState<BoardSortOption>("updatedAt");
		const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
		const [folderToDelete, setFolderToDelete] = useState<{
			id: string;
			name: string;
			boardCount: number;
		} | null>(null);

		// Selection state
		const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(
			new Set(),
		);
		const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

		const isSelectionMode = selectedBoardIds.size > 0;

		const {
			boards,
			isLoading: isBoardsLoading,
			updateBoard,
			deleteBoard,
			deleteBoardsBatch,
			deleteBoardPermanently,
			duplicateBoard,
			moveBoardToFolder,
			getBoardsByFolder,
			deletedBoards,
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

		const handleDeleteFolder = (folderId: string) => {
			const folder = folders.find((f) => f.id === folderId);
			if (!folder) return;

			const boardsInFolder = getBoardsByFolder(folderId);
			setFolderToDelete({
				id: folderId,
				name: folder.name,
				boardCount: boardsInFolder.length,
			});
		};

		const handleConfirmDeleteFolder = () => {
			if (!folderToDelete) return;

			const boardsInFolder = getBoardsByFolder(folderToDelete.id);
			const deletedBoardIds = boardsInFolder.map((b) => b.id);

			// Delete all boards in the folder permanently (no undo)
			for (const board of boardsInFolder) {
				deleteBoardPermanently(board.id);
			}

			// Remove deleted boards from tabs
			if (onRemoveDeletedBoardTabs && deletedBoardIds.length > 0) {
				onRemoveDeletedBoardTabs(deletedBoardIds);
			}

			// If current board was in the folder, open another board
			if (
				currentBoardId &&
				boardsInFolder.some((b) => b.id === currentBoardId)
			) {
				const remainingBoards = boards.filter(
					(b) =>
						b.id !== currentBoardId &&
						!boardsInFolder.some((fb) => fb.id === b.id),
				);
				if (remainingBoards.length > 0) {
					onOpenBoard(remainingBoards[0].id);
				} else {
					onCreateNewBoard();
				}
			}

			// Delete the folder
			deleteFolderFromDB(folderToDelete.id);
			setFolderToDelete(null);
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

		// Selection handlers
		const handleClearSelection = useCallback(() => {
			setSelectedBoardIds(new Set());
			setLastSelectedId(null);
		}, []);

		// Clear selection when search or sort changes
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger on searchQuery/sortBy changes
		useEffect(() => {
			handleClearSelection();
		}, [searchQuery, sortBy, handleClearSelection]);

		// Get all visible board IDs in display order (for range selection)
		const allVisibleBoardIds = useMemo(() => {
			const ids: string[] = [];
			// Add folder boards in order (only from non-collapsed folders)
			for (const folder of folders) {
				if (!folder.collapsed) {
					for (const board of getBoardsByFolder(folder.id)) {
						ids.push(board.id);
					}
				}
			}
			// Add root boards
			for (const board of rootBoards) {
				ids.push(board.id);
			}
			return ids;
		}, [folders, rootBoards, getBoardsByFolder]);

		const handleSelectBoard = useCallback(
			(boardId: string, additive: boolean, range: boolean) => {
				if (range && lastSelectedId) {
					// Shift+click: Select range
					const startIdx = allVisibleBoardIds.indexOf(lastSelectedId);
					const endIdx = allVisibleBoardIds.indexOf(boardId);
					if (startIdx !== -1 && endIdx !== -1) {
						const rangeIds = allVisibleBoardIds.slice(
							Math.min(startIdx, endIdx),
							Math.max(startIdx, endIdx) + 1,
						);
						setSelectedBoardIds((prev) => {
							const next = new Set(prev);
							for (const id of rangeIds) {
								next.add(id);
							}
							return next;
						});
					}
				} else if (additive) {
					// Ctrl/Cmd+click or selection mode click: Toggle selection
					setSelectedBoardIds((prev) => {
						const next = new Set(prev);
						if (next.has(boardId)) {
							next.delete(boardId);
						} else {
							next.add(boardId);
						}
						return next;
					});
					setLastSelectedId(boardId);
				}
			},
			[allVisibleBoardIds, lastSelectedId],
		);

		const handleSelectAll = useCallback(() => {
			setSelectedBoardIds(new Set(allVisibleBoardIds));
		}, [allVisibleBoardIds]);

		// Batch operation handlers (will be connected to useBoards batch functions in Phase 3)
		const handleBatchDelete = useCallback(() => {
			if (selectedBoardIds.size === 0) return;

			// Check if current board is being deleted
			const deletingCurrent =
				currentBoardId && selectedBoardIds.has(currentBoardId);

			// Delete all selected boards at once (with batch undo support)
			deleteBoardsBatch(Array.from(selectedBoardIds));

			// Clear selection
			handleClearSelection();

			// Handle current board deletion
			if (deletingCurrent) {
				const remainingBoards = boards.filter(
					(b) => !selectedBoardIds.has(b.id),
				);
				if (remainingBoards.length > 0) {
					onOpenBoard(remainingBoards[0].id);
				} else {
					onCreateNewBoard();
				}
			}
		}, [
			selectedBoardIds,
			currentBoardId,
			boards,
			deleteBoardsBatch,
			handleClearSelection,
			onOpenBoard,
			onCreateNewBoard,
		]);

		const handleBatchDuplicate = useCallback(() => {
			if (selectedBoardIds.size === 0) return;

			// Duplicate each board individually (will be replaced with batch function)
			for (const id of selectedBoardIds) {
				duplicateBoard(id);
			}

			// Clear selection after duplicate
			handleClearSelection();
		}, [selectedBoardIds, duplicateBoard, handleClearSelection]);

		const handleBatchMoveToFolder = useCallback(
			(folderId: string | null) => {
				if (selectedBoardIds.size === 0) return;

				// Move each board individually (will be replaced with batch function)
				for (const id of selectedBoardIds) {
					moveBoardToFolder(id, folderId);
				}

				// Clear selection after move
				handleClearSelection();
			},
			[selectedBoardIds, moveBoardToFolder, handleClearSelection],
		);

		// Keyboard shortcuts for selection
		useEffect(() => {
			const handleKeyDown = (e: KeyboardEvent) => {
				// Ignore when input focused
				const target = e.target as HTMLElement;
				if (
					target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable
				) {
					return;
				}

				const isMod = e.ctrlKey || e.metaKey;

				// Ctrl/Cmd + A: Select all
				if (isMod && e.key === "a") {
					e.preventDefault();
					handleSelectAll();
					return;
				}

				// Escape: Clear selection
				if (e.key === "Escape") {
					if (selectedBoardIds.size > 0) {
						e.preventDefault();
						handleClearSelection();
						return;
					}
				}

				// Delete/Backspace: Delete selected
				if (
					(e.key === "Delete" || e.key === "Backspace") &&
					selectedBoardIds.size > 0
				) {
					e.preventDefault();
					handleBatchDelete();
					return;
				}
			};

			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}, [
			selectedBoardIds,
			handleSelectAll,
			handleClearSelection,
			handleBatchDelete,
		]);

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
										selectedBoardIds={selectedBoardIds}
										isSelectionMode={isSelectionMode}
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
										onSelectBoard={handleSelectBoard}
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
									selectedBoardIds={selectedBoardIds}
									isSelectionMode={isSelectionMode}
									isLoading={isLoading}
									searchQuery={searchQuery}
									onOpenBoard={handleOpenBoard}
									onSelectBoard={handleSelectBoard}
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

						{/* Selection toolbar */}
						<SelectionToolbar
							selectedCount={selectedBoardIds.size}
							folders={folders}
							onClear={handleClearSelection}
							onDelete={handleBatchDelete}
							onDuplicate={handleBatchDuplicate}
							onMoveToFolder={handleBatchMoveToFolder}
						/>
					</DialogContent>
				</Dialog>

				{/* Undo toast */}
				{deletedBoards.length > 0 && (
					<UndoToast
						boardName={deletedBoards[0].name}
						deletedCount={deletedBoards.length}
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

				{/* Delete folder confirmation dialog */}
				<DeleteFolderDialog
					open={folderToDelete !== null}
					onOpenChange={(open) => {
						if (!open) setFolderToDelete(null);
					}}
					folderName={folderToDelete?.name ?? ""}
					boardCount={folderToDelete?.boardCount ?? 0}
					onConfirm={handleConfirmDeleteFolder}
				/>
			</>
		);
	},
);
