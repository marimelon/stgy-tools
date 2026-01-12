import {
	AlertTriangle,
	Check,
	Copy,
	FolderPlus,
	Link,
	Loader2,
	X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cacheCreatedGroup } from "@/lib/server/shortLinks/createdGroupCache";
import { createGroupFn } from "@/lib/server/shortLinks/serverFn";

interface CreateGroupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	stgyCodes: string[];
	onCreated: (groupId: string) => void;
}

interface CreatedGroupInfo {
	editKey?: string;
	groupId: string;
	url: string;
	usedCustomKey: boolean;
}

export function CreateGroupDialog({
	open,
	onOpenChange,
	stgyCodes,
	onCreated,
}: CreateGroupDialogProps) {
	const { t } = useTranslation();
	const nameInputId = useId();
	const descriptionInputId = useId();
	const customKeyCheckboxId = useId();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [useCustomKey, setUseCustomKey] = useState(false);
	const [customEditKey, setCustomEditKey] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [createdInfo, setCreatedInfo] = useState<CreatedGroupInfo | null>(null);
	const [copiedUrl, setCopiedUrl] = useState(false);
	const [copiedEditKey, setCopiedEditKey] = useState(false);
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

	const handleCreate = async () => {
		setIsCreating(true);
		setError(null);
		try {
			const result = await createGroupFn({
				data: {
					name,
					description: description || undefined,
					stgyCodes,
					baseUrl: window.location.origin,
					customEditKey: useCustomKey ? customEditKey : undefined,
				},
			});

			if (result.success) {
				// Auto-copy URL to clipboard (optional, silently fail)
				try {
					await navigator.clipboard.writeText(result.data.url);
				} catch {
					// Clipboard access may be denied - ignore
				}

				// Cache group data for immediate display (handles KV propagation delay)
				cacheCreatedGroup(result.data.id, {
					name,
					description: description || undefined,
					stgyCodes,
				});

				setCreatedInfo({
					editKey: result.data.editKey,
					groupId: result.data.id,
					url: result.data.url,
					usedCustomKey: useCustomKey,
				});
			} else {
				setError(t(`viewer.group.error.${result.code}`, result.error));
			}
		} catch {
			setError(t("viewer.group.error.STORAGE_ERROR"));
		} finally {
			setIsCreating(false);
		}
	};

	const handleCopyUrl = async () => {
		if (!createdInfo) return;
		try {
			await navigator.clipboard.writeText(createdInfo.url);
			setCopiedUrl(true);
			setCopyError(false);
			copyTimersRef.current.push(setTimeout(() => setCopiedUrl(false), 2000));
		} catch {
			setCopyError(true);
			copyTimersRef.current.push(setTimeout(() => setCopyError(false), 2000));
		}
	};

	const handleCopyEditKey = async () => {
		if (!createdInfo?.editKey) return;
		try {
			await navigator.clipboard.writeText(createdInfo.editKey);
			setCopiedEditKey(true);
			setCopyError(false);
			copyTimersRef.current.push(
				setTimeout(() => setCopiedEditKey(false), 2000),
			);
		} catch {
			setCopyError(true);
			copyTimersRef.current.push(setTimeout(() => setCopyError(false), 2000));
		}
	};

	const handleClose = () => {
		setName("");
		setDescription("");
		setUseCustomKey(false);
		setCustomEditKey("");
		setError(null);
		setCreatedInfo(null);
		setCopiedUrl(false);
		setCopiedEditKey(false);
		setCopyError(false);
		onOpenChange(false);
	};

	const handleCloseAndNavigate = () => {
		if (createdInfo) {
			onCreated(createdInfo.groupId);
		}
		handleClose();
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			if (createdInfo) {
				// User closing after creation - navigate to the group
				onCreated(createdInfo.groupId);
			}
			handleClose();
		} else {
			onOpenChange(newOpen);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				{createdInfo ? (
					// Success screen with URL and edit key
					<>
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								<Check className="size-5 text-green-500" />
								{t("viewer.group.createdTitle")}
							</DialogTitle>
							<DialogDescription>
								{t("viewer.group.createdDescription")}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							{/* Group URL */}
							<div className="space-y-2">
								<Label className="flex items-center gap-1.5">
									<Link className="size-4" />
									{t("viewer.group.groupUrl")}
								</Label>
								<div className="flex gap-2">
									<Input
										value={createdInfo.url}
										readOnly
										className="font-mono text-sm"
									/>
									<Button
										variant="outline"
										size="icon"
										onClick={handleCopyUrl}
										title={t("viewer.group.copyUrl")}
									>
										{copiedUrl ? (
											<Check className="size-4 text-green-500" />
										) : copyError ? (
											<X className="size-4 text-destructive" />
										) : (
											<Copy className="size-4" />
										)}
									</Button>
								</div>
							</div>

							{/* Edit key - only shown when not using custom key */}
							{!createdInfo.usedCustomKey && createdInfo.editKey && (
								<>
									<div className="space-y-2">
										<Label>{t("viewer.group.editKey")}</Label>
										<div className="flex gap-2">
											<Input
												value={createdInfo.editKey}
												readOnly
												className="font-mono"
											/>
											<Button
												variant="outline"
												size="icon"
												onClick={handleCopyEditKey}
												title={t("common.copy")}
											>
												{copiedEditKey ? (
													<Check className="size-4 text-green-500" />
												) : copyError ? (
													<X className="size-4 text-destructive" />
												) : (
													<Copy className="size-4" />
												)}
											</Button>
										</div>
									</div>

									<div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
										<AlertTriangle className="size-5 shrink-0 mt-0.5" />
										<p className="text-sm">
											{t("viewer.group.editKeyWarning")}
										</p>
									</div>
								</>
							)}
						</div>

						<DialogFooter>
							<Button onClick={handleCloseAndNavigate}>
								{t("common.close")}
							</Button>
						</DialogFooter>
					</>
				) : (
					// Creation form
					<>
						<DialogHeader>
							<DialogTitle>{t("viewer.group.createTitle")}</DialogTitle>
							<DialogDescription>
								{t("viewer.group.createDescription", {
									count: stgyCodes.length,
								})}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={nameInputId}>{t("viewer.group.name")}</Label>
								<Input
									id={nameInputId}
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder={t("viewer.group.namePlaceholder")}
									maxLength={50}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={descriptionInputId}>
									{t("viewer.group.description")}
								</Label>
								<Textarea
									id={descriptionInputId}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder={t("viewer.group.descriptionPlaceholder")}
									className="h-20"
									maxLength={500}
								/>
							</div>

							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<Checkbox
										id={customKeyCheckboxId}
										checked={useCustomKey}
										onCheckedChange={(checked) =>
											setUseCustomKey(checked === true)
										}
									/>
									<Label
										htmlFor={customKeyCheckboxId}
										className="text-sm font-normal cursor-pointer"
									>
										{t("viewer.group.useCustomKey")}
									</Label>
								</div>
								{useCustomKey && (
									<div className="space-y-2">
										<Input
											value={customEditKey}
											onChange={(e) => setCustomEditKey(e.target.value)}
											placeholder={t("viewer.group.customKeyPlaceholder")}
											type="password"
											maxLength={64}
										/>
										<p className="text-xs text-muted-foreground">
											{t("viewer.group.customKeyHint")}
										</p>
									</div>
								)}
							</div>

							{error && <p className="text-sm text-destructive">{error}</p>}
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => handleOpenChange(false)}>
								{t("common.cancel")}
							</Button>
							<Button
								onClick={handleCreate}
								disabled={
									!name.trim() ||
									isCreating ||
									(useCustomKey && customEditKey.trim().length < 4)
								}
							>
								{isCreating ? (
									<Loader2 className="size-4 animate-spin mr-2" />
								) : (
									<FolderPlus className="size-4 mr-2" />
								)}
								{t("viewer.group.create")}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
