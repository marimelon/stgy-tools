/**
 * Board card component for the board manager grid
 */

import { Copy, FolderOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StoredBoard } from "@/lib/boards";
import { useDebugMode } from "@/lib/settings";
import { MAX_BOARD_NAME_LENGTH } from "@/lib/stgy";
import { BoardThumbnail } from "./BoardThumbnail";

export interface BoardCardProps {
	board: StoredBoard;
	isCurrent: boolean;
	onOpen: () => void;
	onRename: (newName: string) => void;
	onDuplicate: () => void;
	onDelete: () => void;
}

export function BoardCard({
	board,
	isCurrent,
	onOpen,
	onRename,
	onDuplicate,
	onDelete,
}: BoardCardProps) {
	const { t } = useTranslation();
	const debugMode = useDebugMode();
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(board.name);
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input when editing starts
	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleStartEdit = () => {
		setEditName(board.name);
		setIsEditing(true);
	};

	const handleSaveEdit = () => {
		let trimmed = editName.trim();
		// 確定時に文字数制限を適用
		if (!debugMode && trimmed.length > MAX_BOARD_NAME_LENGTH) {
			trimmed = trimmed.slice(0, MAX_BOARD_NAME_LENGTH);
		}
		if (trimmed && trimmed !== board.name) {
			onRename(trimmed);
		}
		setIsEditing(false);
	};

	const handleCancelEdit = () => {
		setEditName(board.name);
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSaveEdit();
		} else if (e.key === "Escape") {
			handleCancelEdit();
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div
			className={`group relative rounded-lg border bg-card overflow-hidden transition-all hover:border-primary/50 ${
				isCurrent ? "ring-2 ring-primary border-primary" : ""
			}`}
		>
			{/* Thumbnail */}
			<button
				type="button"
				onClick={onOpen}
				className="w-full aspect-[4/3] bg-muted cursor-pointer"
			>
				<BoardThumbnail stgyCode={board.stgyCode} className="w-full h-full" />
			</button>

			{/* Current indicator */}
			{isCurrent && (
				<div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
					{t("boardManager.currentBoard")}
				</div>
			)}

			{/* Info section */}
			<div className="p-3">
				{/* Name */}
				{isEditing ? (
					<input
						ref={inputRef}
						type="text"
						value={editName}
						onChange={(e) => setEditName(e.target.value)}
						onCompositionEnd={(e) => {
							// IME確定時に文字数制限を適用
							if (!debugMode) {
								const value = e.currentTarget.value;
								if (value.length > MAX_BOARD_NAME_LENGTH) {
									setEditName(value.slice(0, MAX_BOARD_NAME_LENGTH));
								}
							}
						}}
						onBlur={handleSaveEdit}
						onKeyDown={handleKeyDown}
						className="w-full px-2 py-1 text-sm font-medium border border-border rounded bg-background"
					/>
				) : (
					<h3 className="font-medium text-sm truncate" title={board.name}>
						{board.name}
					</h3>
				)}

				{/* Date */}
				<p className="text-xs text-muted-foreground mt-1">
					{formatDate(board.updatedAt)}
				</p>
			</div>

			{/* Actions menu */}
			<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="secondary"
							size="icon"
							className="size-7"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={onOpen}>
							<FolderOpen className="size-4 mr-2" />
							{t("boardManager.open")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleStartEdit}>
							<Pencil className="size-4 mr-2" />
							{t("boardManager.rename")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onDuplicate}>
							<Copy className="size-4 mr-2" />
							{t("boardManager.duplicate")}
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={onDelete}
							className="text-destructive focus:text-destructive"
						>
							<Trash2 className="size-4 mr-2" />
							{t("boardManager.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
