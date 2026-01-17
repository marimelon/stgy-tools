/**
 * Board card component for the board manager grid
 */

import {
	Check,
	ClipboardCopy,
	Copy,
	Folder,
	FolderOpen,
	FolderOutput,
	MoreHorizontal,
	Pencil,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StoredBoard, StoredFolder } from "@/lib/boards";
import { useDebugMode } from "@/lib/settings";
import { MAX_BOARD_NAME_LENGTH } from "@/lib/stgy";
import { BoardThumbnail } from "./BoardThumbnail";

export interface BoardCardProps {
	board: StoredBoard;
	isCurrent: boolean;
	isSelected?: boolean;
	isSelectionMode?: boolean;
	onOpen: () => void;
	onSelect?: (additive: boolean, range: boolean) => void;
	onRename: (newName: string) => void;
	onDuplicate: () => void;
	onDelete: () => void;
	onMoveToFolder?: (folderId: string | null) => void;
	folders?: StoredFolder[];
	currentFolderId?: string | null;
}

/** Long press threshold in milliseconds */
const LONG_PRESS_THRESHOLD_MS = 500;

export function BoardCard({
	board,
	isCurrent,
	isSelected = false,
	isSelectionMode = false,
	onOpen,
	onSelect,
	onRename,
	onDuplicate,
	onDelete,
	onMoveToFolder,
	folders,
	currentFolderId,
}: BoardCardProps) {
	const { t } = useTranslation();
	const debugMode = useDebugMode();
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(board.name);
	const inputRef = useRef<HTMLInputElement>(null);
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isLongPressRef = useRef(false);

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
		// Apply character limit on confirm
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

	const handleCopyStgyCode = async () => {
		try {
			await navigator.clipboard.writeText(board.stgyCode);
		} catch {
			// Fallback for older browsers
			const textarea = document.createElement("textarea");
			textarea.value = board.stgyCode;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
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

	// Handle click on thumbnail
	const handleThumbnailClick = (e: React.MouseEvent) => {
		// In selection mode, toggle selection
		if (isSelectionMode) {
			onSelect?.(true, e.shiftKey);
			return;
		}

		// Ctrl/Cmd + click: enter selection mode and select
		const isMod = e.ctrlKey || e.metaKey;
		if (isMod && onSelect) {
			onSelect(true, false);
			return;
		}

		// Shift + click: range selection
		if (e.shiftKey && onSelect) {
			onSelect(false, true);
			return;
		}

		// Normal click: open board
		onOpen();
	};

	// Long press handlers for touch devices
	const handlePointerDown = (e: React.PointerEvent) => {
		// Only handle touch events for long press
		if (e.pointerType !== "touch") return;

		isLongPressRef.current = false;
		longPressTimerRef.current = setTimeout(() => {
			isLongPressRef.current = true;
			onSelect?.(true, false);
		}, LONG_PRESS_THRESHOLD_MS);
	};

	const handlePointerUp = () => {
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
	};

	const handlePointerCancel = () => {
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
	};

	// Handle touch click (prevent opening if long press occurred)
	const handleTouchClick = (e: React.MouseEvent) => {
		if (isLongPressRef.current) {
			e.preventDefault();
			e.stopPropagation();
			isLongPressRef.current = false;
			return;
		}
		handleThumbnailClick(e);
	};

	// Generate card class names
	const cardClassName = [
		"group relative rounded-lg border bg-card overflow-hidden transition-all hover:border-primary/50",
		isCurrent && "ring-2 ring-primary border-primary",
		isSelected &&
			"ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/30",
		isSelectionMode && "cursor-pointer",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={cardClassName}>
			{/* Thumbnail */}
			<button
				type="button"
				onClick={handleTouchClick}
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerCancel}
				onPointerLeave={handlePointerCancel}
				className="w-full aspect-[4/3] bg-muted cursor-pointer touch-none"
			>
				<BoardThumbnail stgyCode={board.stgyCode} className="w-full h-full" />
			</button>

			{/* Selection checkbox (always available, visible on hover or when selected/in selection mode) */}
			{onSelect && (
				<button
					type="button"
					className={`absolute top-2 left-2 z-10 transition-opacity ${
						isSelectionMode || isSelected
							? "opacity-100"
							: "opacity-0 group-hover:opacity-100"
					}`}
					onClick={(e) => {
						e.stopPropagation();
						onSelect(true, e.shiftKey);
					}}
				>
					<div
						className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
							isSelected
								? "bg-blue-500 border-blue-500 text-white"
								: "bg-white/80 border-gray-400 dark:bg-gray-800/80 dark:border-gray-500 hover:border-blue-400"
						}`}
					>
						{isSelected && <Check className="size-3" />}
					</div>
				</button>
			)}

			{/* Current indicator */}
			{isCurrent && !isSelectionMode && (
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
							// Apply character limit on IME composition end
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
						<DropdownMenuItem onClick={handleCopyStgyCode}>
							<ClipboardCopy className="size-4 mr-2" />
							{t("boardManager.copyStgyCode")}
						</DropdownMenuItem>
						{onMoveToFolder && folders && folders.length > 0 && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuSub>
									<DropdownMenuSubTrigger>
										<Folder className="size-4 mr-2" />
										{t("boardManager.folder.moveToFolder")}
									</DropdownMenuSubTrigger>
									<DropdownMenuPortal>
										<DropdownMenuSubContent>
											{currentFolderId !== null && (
												<DropdownMenuItem onClick={() => onMoveToFolder(null)}>
													<FolderOutput className="size-4 mr-2" />
													{t("boardManager.folder.moveToRoot")}
												</DropdownMenuItem>
											)}
											{folders
												.filter((f) => f.id !== currentFolderId)
												.map((folder) => (
													<DropdownMenuItem
														key={folder.id}
														onClick={() => onMoveToFolder(folder.id)}
													>
														<Folder className="size-4 mr-2" />
														{folder.name}
													</DropdownMenuItem>
												))}
										</DropdownMenuSubContent>
									</DropdownMenuPortal>
								</DropdownMenuSub>
							</>
						)}
						<DropdownMenuSeparator />
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
