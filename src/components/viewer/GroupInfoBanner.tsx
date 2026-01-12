import {
	ArrowLeft,
	Check,
	ClipboardCopy,
	FolderOpen,
	History,
	Link,
	Loader2,
	Pencil,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface GroupInfoBannerProps {
	name: string;
	description?: string;
	boardCount: number;
	groupUrl?: string;
	/** Stgy codes for copying */
	stgyCodes?: string[];
	version?: number;
	currentVersion?: number;
	isPastVersion?: boolean;
	isEditMode: boolean;
	isUpdating: boolean;
	/** Error message to display in edit mode */
	updateError?: string | null;
	editedName: string;
	editedDescription: string;
	/** Whether there are valid stgy codes to save */
	hasValidStgyCodes?: boolean;
	onEditedNameChange: (name: string) => void;
	onEditedDescriptionChange: (description: string) => void;
	onEditClick: () => void;
	onCancelEdit: () => void;
	onSaveEdit: () => void;
	onDeleteClick: () => void;
	onHistoryClick: () => void;
	onBackToCurrentVersion?: () => void;
}

export function GroupInfoBanner({
	name,
	description,
	boardCount,
	groupUrl,
	stgyCodes,
	version,
	currentVersion,
	isPastVersion,
	isEditMode,
	isUpdating,
	updateError,
	editedName,
	editedDescription,
	hasValidStgyCodes = true,
	onEditedNameChange,
	onEditedDescriptionChange,
	onEditClick,
	onCancelEdit,
	onSaveEdit,
	onDeleteClick,
	onHistoryClick,
	onBackToCurrentVersion,
}: GroupInfoBannerProps) {
	const { t } = useTranslation();
	const nameInputId = useId();
	const descriptionInputId = useId();
	const [urlCopied, setUrlCopied] = useState(false);
	const [codesCopied, setCodesCopied] = useState(false);
	const [copyError, setCopyError] = useState(false);
	const copyTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			for (const timer of copyTimersRef.current) {
				clearTimeout(timer);
			}
		};
	}, []);

	const handleCopyUrl = async () => {
		if (!groupUrl) return;
		try {
			await navigator.clipboard.writeText(groupUrl);
			setUrlCopied(true);
			setCopyError(false);
			copyTimersRef.current.push(setTimeout(() => setUrlCopied(false), 2000));
		} catch {
			setCopyError(true);
			copyTimersRef.current.push(setTimeout(() => setCopyError(false), 2000));
		}
	};

	const handleCopyCodes = async () => {
		if (!stgyCodes || stgyCodes.length === 0) return;
		try {
			await navigator.clipboard.writeText(stgyCodes.join("\n"));
			setCodesCopied(true);
			setCopyError(false);
			copyTimersRef.current.push(setTimeout(() => setCodesCopied(false), 2000));
		} catch {
			setCopyError(true);
			copyTimersRef.current.push(setTimeout(() => setCopyError(false), 2000));
		}
	};

	// Reset copied states when entering edit mode
	useEffect(() => {
		if (isEditMode) {
			setUrlCopied(false);
			setCodesCopied(false);
			setCopyError(false);
		}
	}, [isEditMode]);

	// Viewing past version
	if (isPastVersion) {
		return (
			<div className="mb-4 p-4 bg-card border border-amber-500/50 rounded-lg">
				<div className="flex items-center gap-2">
					<History className="size-5 text-amber-500" />
					<h2 className="font-semibold text-lg">{name}</h2>
					{version !== undefined && (
						<Badge
							variant="outline"
							className="text-amber-600 border-amber-500/50"
						>
							v{version} ({t("viewer.group.pastVersion")})
						</Badge>
					)}
					<Badge variant="secondary">
						{t("viewer.group.boardCount", { count: boardCount })}
					</Badge>
					{currentVersion && (
						<span className="text-xs text-muted-foreground">
							({t("viewer.group.latestVersion")}: v{currentVersion})
						</span>
					)}

					<div className="flex-1" />

					{onBackToCurrentVersion && (
						<Button
							variant="outline"
							size="sm"
							onClick={onBackToCurrentVersion}
						>
							<ArrowLeft className="size-4 mr-1" />
							{t("viewer.group.backToCurrent")}
						</Button>
					)}
				</div>
				{description && (
					<p className="text-muted-foreground text-sm mt-2 pl-7">
						{description}
					</p>
				)}
			</div>
		);
	}

	if (isEditMode) {
		return (
			<div className="mb-4 p-4 bg-card border border-primary/50 rounded-lg">
				<div className="flex items-center gap-2 mb-3">
					<FolderOpen className="size-5 text-primary" />
					<div className="flex-1">
						<Input
							id={nameInputId}
							value={editedName}
							onChange={(e) => onEditedNameChange(e.target.value)}
							placeholder={t("viewer.group.namePlaceholder")}
							className="font-semibold"
							disabled={isUpdating}
							maxLength={50}
						/>
					</div>
					{version && (
						<Badge variant="outline" className="text-xs">
							v{version}
						</Badge>
					)}
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={onCancelEdit}
							disabled={isUpdating}
						>
							<X className="size-4 mr-1" />
							{t("common.cancel")}
						</Button>
						<Button
							size="sm"
							onClick={onSaveEdit}
							disabled={!editedName.trim() || !hasValidStgyCodes || isUpdating}
						>
							{isUpdating ? (
								<Loader2 className="size-4 animate-spin mr-1" />
							) : (
								<Check className="size-4 mr-1" />
							)}
							{t("viewer.group.update")}
						</Button>
					</div>
				</div>
				<div className="pl-7 flex items-end gap-4">
					<Textarea
						id={descriptionInputId}
						value={editedDescription}
						onChange={(e) => onEditedDescriptionChange(e.target.value)}
						placeholder={t("viewer.group.descriptionPlaceholder")}
						className="text-sm h-16 resize-none flex-1"
						disabled={isUpdating}
						maxLength={500}
					/>
					<Button
						variant="ghost"
						size="sm"
						onClick={onDeleteClick}
						disabled={isUpdating}
						className="text-destructive hover:text-destructive hover:bg-destructive/10"
					>
						<Trash2 className="size-4 mr-1" />
						{t("viewer.group.delete")}
					</Button>
				</div>
				{updateError && (
					<p className="pl-7 mt-2 text-sm text-destructive">{updateError}</p>
				)}
			</div>
		);
	}

	return (
		<div className="mb-4 p-4 bg-card border border-border rounded-lg">
			<div className="flex items-center gap-2">
				<FolderOpen className="size-5 text-primary" />
				<h2 className="font-semibold text-lg">{name}</h2>
				<Badge variant="secondary">
					{t("viewer.group.boardCount", { count: boardCount })}
				</Badge>
				{version && (
					<button
						type="button"
						onClick={onHistoryClick}
						className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded transition-colors"
						title={t("viewer.group.viewHistory")}
					>
						<History className="size-3" />
						<span>v{version}</span>
					</button>
				)}

				<div className="flex-1" />

				<div className="flex items-center gap-1">
					{groupUrl && (
						<button
							type="button"
							onClick={handleCopyUrl}
							className="p-2 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded transition-colors"
							title={t("viewer.group.copyUrl")}
						>
							{urlCopied ? (
								<Check className="size-4 text-green-500" />
							) : copyError ? (
								<X className="size-4 text-destructive" />
							) : (
								<Link className="size-4" />
							)}
						</button>
					)}

					{stgyCodes && stgyCodes.length > 0 && (
						<button
							type="button"
							onClick={handleCopyCodes}
							className="p-2 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded transition-colors"
							title={t("viewer.group.copyCodes")}
						>
							{codesCopied ? (
								<Check className="size-4 text-green-500" />
							) : copyError ? (
								<X className="size-4 text-destructive" />
							) : (
								<ClipboardCopy className="size-4" />
							)}
						</button>
					)}

					<button
						type="button"
						onClick={onEditClick}
						className="p-2 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded transition-colors"
						title={t("viewer.group.edit")}
					>
						<Pencil className="size-4" />
					</button>
				</div>
			</div>
			{description && (
				<p className="text-muted-foreground text-sm mt-2 pl-7">{description}</p>
			)}
		</div>
	);
}
