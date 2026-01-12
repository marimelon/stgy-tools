import { Eye, History, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getGroupHistoryFn } from "@/lib/server/shortLinks/serverFn";
import type { BoardGroupVersion } from "@/lib/server/shortLinks/types";

interface GroupHistoryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	groupId: string;
	currentVersion?: number;
	onViewVersion?: (version: BoardGroupVersion) => void;
}

export function GroupHistoryDialog({
	open,
	onOpenChange,
	groupId,
	currentVersion,
	onViewVersion,
}: GroupHistoryDialogProps) {
	const { t } = useTranslation();
	const [history, setHistory] = useState<BoardGroupVersion[] | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const lastVersionRef = useRef<number | undefined>(undefined);

	// Clear cache when currentVersion changes (group was edited)
	useEffect(() => {
		if (
			currentVersion !== undefined &&
			lastVersionRef.current !== undefined &&
			currentVersion !== lastVersionRef.current
		) {
			setHistory(null);
		}
		lastVersionRef.current = currentVersion;
	}, [currentVersion]);

	useEffect(() => {
		if (open && !history) {
			setIsLoading(true);
			setError(null);
			getGroupHistoryFn({ data: { groupId } })
				.then((result) => {
					setHistory(result ?? []);
				})
				.catch(() => {
					setError(t("viewer.group.error.STORAGE_ERROR"));
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [open, groupId, history, t]);

	const handleClose = () => {
		onOpenChange(false);
		// Keep history cache - only clear when version changes
	};

	const handleViewVersion = (version: BoardGroupVersion) => {
		handleClose();
		onViewVersion?.(version);
	};

	const formatDate = (isoString: string) => {
		try {
			const date = new Date(isoString);
			return date.toLocaleString();
		} catch {
			return isoString;
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<History className="size-5" />
						{t("viewer.group.historyTitle")}
					</DialogTitle>
					<DialogDescription>
						{t("viewer.group.historyDescription")}
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-80 overflow-y-auto space-y-3">
					{isLoading && (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="size-6 animate-spin text-muted-foreground" />
						</div>
					)}

					{error && <p className="text-sm text-destructive">{error}</p>}

					{!isLoading && !error && history && (
						<>
							{/* Current version */}
							{currentVersion && (
								<div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
									<div className="flex items-center gap-2 mb-1">
										<span className="font-medium">
											v{currentVersion} ({t("viewer.group.currentVersion")})
										</span>
									</div>
								</div>
							)}

							{/* History versions (newest first) */}
							{history.length > 0 ? (
								[...history].reverse().map((version) => (
									<div
										key={version.version}
										className="p-3 rounded-lg bg-muted/50 border border-border"
									>
										<div className="flex items-center justify-between gap-2 mb-1">
											<span className="font-medium">v{version.version}</span>
											<span className="text-xs text-muted-foreground">
												{formatDate(version.updatedAt)}
											</span>
										</div>
										<div className="flex items-center justify-between gap-2">
											<div className="text-sm text-muted-foreground">
												<span>{version.name}</span>
												<span className="mx-2">·</span>
												<span>
													{t("viewer.group.boardCount", {
														count: version.stgyCodes.length,
													})}
												</span>
											</div>
											{onViewVersion && (
												<button
													type="button"
													onClick={() => handleViewVersion(version)}
													className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
												>
													<Eye className="size-3" />
													{t("viewer.group.viewVersion")}
												</button>
											)}
										</div>
									</div>
								))
							) : (
								<p className="text-sm text-muted-foreground text-center py-4">
									{t("viewer.group.noHistory")}
								</p>
							)}
						</>
					)}
				</div>

				<DialogFooter>
					<Button onClick={handleClose}>{t("common.close")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
