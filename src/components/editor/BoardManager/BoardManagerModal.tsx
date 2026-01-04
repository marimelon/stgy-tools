/**
 * Board Manager Modal component
 * @ebay/nice-modal-react + Radix Dialog ベース
 */

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { ArrowUpDown, Plus, Search } from "lucide-react";
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
import { type BoardSortOption, useBoards } from "@/lib/boards";
import { BoardGrid } from "./BoardGrid";
import { UndoToast } from "./UndoToast";

export interface BoardManagerModalProps {
	currentBoardId: string | null;
	onOpenBoard: (id: string) => void;
	onCreateNewBoard: () => void;
}

export const BoardManagerModal = NiceModal.create(
	({
		currentBoardId,
		onOpenBoard,
		onCreateNewBoard,
	}: BoardManagerModalProps) => {
		const { t } = useTranslation();
		const modal = useModal();
		const [searchQuery, setSearchQuery] = useState("");
		const [sortBy, setSortBy] = useState<BoardSortOption>("updatedAt");

		const {
			boards,
			isLoading,
			updateBoard,
			deleteBoard,
			duplicateBoard,
			deletedBoard,
			undoDelete,
			dismissUndo,
		} = useBoards({
			sortBy,
			sortDirection: "desc",
			searchQuery,
		});

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
						className="sm:max-w-2xl md:max-w-4xl max-h-[80vh] flex flex-col"
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

							{/* New board button */}
							<Button onClick={handleCreateNew}>
								<Plus className="size-4 mr-2" />
								{t("boardManager.newBoard")}
							</Button>
						</div>

						{/* Board grid */}
						<div className="flex-1 overflow-y-auto mt-4">
							<BoardGrid
								boards={boards}
								currentBoardId={currentBoardId}
								isLoading={isLoading}
								searchQuery={searchQuery}
								onOpenBoard={handleOpenBoard}
								onRenameBoard={handleRenameBoard}
								onDuplicateBoard={handleDuplicateBoard}
								onDeleteBoard={handleDeleteBoard}
								onCreateNew={handleCreateNew}
							/>
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
			</>
		);
	},
);
