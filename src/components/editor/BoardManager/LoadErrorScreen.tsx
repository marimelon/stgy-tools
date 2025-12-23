/**
 * Full screen error display for storage load failures
 */

import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BoardsError } from "@/lib/boards";

export interface LoadErrorScreenProps {
	error: BoardsError;
	onRetry: () => void;
	onStartWithoutSaving: () => void;
}

export function LoadErrorScreen({
	error,
	onRetry,
	onStartWithoutSaving,
}: LoadErrorScreenProps) {
	const { t } = useTranslation();

	const isPrivateBrowsing = error.type === "indexeddb_unavailable";

	return (
		<div className="h-screen flex items-center justify-center bg-background p-4">
			<div className="max-w-md w-full text-center">
				{/* Icon */}
				<div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
					<AlertTriangle className="size-8 text-destructive" />
				</div>

				{/* Title */}
				<h1 className="text-xl font-semibold mb-2">
					{t("boardManager.error.loadFailed.title")}
				</h1>

				{/* Description */}
				<p className="text-muted-foreground mb-2">
					{t("boardManager.error.loadFailed.description")}
				</p>

				{/* Private browsing hint */}
				{isPrivateBrowsing && (
					<p className="text-sm text-muted-foreground mb-6">
						{t("boardManager.error.loadFailed.privateMode")}
					</p>
				)}

				{/* Actions */}
				<div className="flex flex-col gap-3 mt-6">
					<Button onClick={onRetry} variant="default">
						<RefreshCw className="size-4 mr-2" />
						{t("boardManager.error.retry")}
					</Button>

					<Button onClick={onStartWithoutSaving} variant="outline">
						<FilePlus className="size-4 mr-2" />
						{t("boardManager.error.continueWithoutSaving")}
					</Button>

					<p className="text-xs text-muted-foreground mt-2">
						{t("boardManager.error.warningNoSave")}
					</p>
				</div>
			</div>
		</div>
	);
}
