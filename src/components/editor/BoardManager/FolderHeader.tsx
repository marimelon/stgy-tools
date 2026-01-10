/**
 * Folder Header component
 * Displays folder name, collapse/expand toggle, and action menu
 */

import {
	ChevronDown,
	ChevronRight,
	Edit,
	ExternalLink,
	Folder,
	FolderOpen,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { StoredFolder } from "@/lib/boards";

interface FolderHeaderProps {
	folder: StoredFolder;
	boardCount: number;
	onToggleCollapse: () => void;
	onRename: (newName: string) => void;
	onDelete: () => void;
	onOpenInViewer?: () => void;
	onOpenAllInEditor?: () => void;
	/** Drag handlers for reordering folders */
	onDragStart?: (e: React.DragEvent) => void;
	onDragOver?: (e: React.DragEvent) => void;
	onDragLeave?: (e: React.DragEvent) => void;
	onDrop?: (e: React.DragEvent) => void;
	isDragOver?: boolean;
}

export function FolderHeader({
	folder,
	boardCount,
	onToggleCollapse,
	onRename,
	onDelete,
	onOpenInViewer,
	onOpenAllInEditor,
	onDragStart,
	onDragOver,
	onDragLeave,
	onDrop,
	isDragOver,
}: FolderHeaderProps) {
	const { t } = useTranslation();
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(folder.name);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	const handleStartEdit = () => {
		setEditName(folder.name);
		setIsEditing(true);
	};

	const handleSaveEdit = () => {
		const trimmedName = editName.trim();
		if (trimmedName && trimmedName !== folder.name) {
			onRename(trimmedName);
		}
		setIsEditing(false);
	};

	const handleCancelEdit = () => {
		setEditName(folder.name);
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSaveEdit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			handleCancelEdit();
		}
	};

	return (
		<li
			className={`flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg border transition-colors list-none ${
				isDragOver ? "border-primary bg-primary/10" : "border-transparent"
			}`}
			draggable={!isEditing}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
		>
			{/* Collapse/Expand button */}
			<Button
				variant="ghost"
				size="icon"
				className="size-6 shrink-0"
				onClick={onToggleCollapse}
			>
				{folder.collapsed ? (
					<ChevronRight className="size-4" />
				) : (
					<ChevronDown className="size-4" />
				)}
			</Button>

			{/* Folder icon */}
			<Folder className="size-4 text-muted-foreground shrink-0" />

			{/* Folder name (editable) */}
			{isEditing ? (
				<Input
					ref={inputRef}
					value={editName}
					onChange={(e) => setEditName(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleSaveEdit}
					className="h-6 text-sm flex-1"
				/>
			) : (
				<button
					type="button"
					className="flex-1 text-left text-sm font-medium truncate hover:underline"
					onClick={onToggleCollapse}
					onDoubleClick={handleStartEdit}
				>
					{folder.name}
				</button>
			)}

			{/* Board count */}
			<span className="text-xs text-muted-foreground shrink-0">
				({boardCount})
			</span>

			{/* Action menu */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="size-6 shrink-0">
						<MoreHorizontal className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{onOpenAllInEditor && boardCount > 0 && (
						<DropdownMenuItem onClick={onOpenAllInEditor}>
							<FolderOpen className="size-4 mr-2" />
							{t("boardManager.folder.openAllInEditor")}
						</DropdownMenuItem>
					)}
					{onOpenInViewer && boardCount > 0 && (
						<DropdownMenuItem onClick={onOpenInViewer}>
							<ExternalLink className="size-4 mr-2" />
							{t("boardManager.folder.openInViewer")}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={handleStartEdit}>
						<Edit className="size-4 mr-2" />
						{t("boardManager.folder.rename")}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onClick={onDelete}
						className="text-destructive focus:text-destructive"
					>
						<Trash2 className="size-4 mr-2" />
						{t("boardManager.folder.delete")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</li>
	);
}
