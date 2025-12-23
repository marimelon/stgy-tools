/**
 * Empty state component for when no boards exist
 */

import { useTranslation } from "react-i18next";
import { FolderPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
	hasSearchQuery: boolean;
	onCreateNew: () => void;
}

export function EmptyState({ hasSearchQuery, onCreateNew }: EmptyStateProps) {
	const { t } = useTranslation();

	if (hasSearchQuery) {
		return (
			<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
				<Search className="size-12 text-muted-foreground mb-4" />
				<h3 className="text-lg font-medium mb-2">
					{t("boardManager.emptyState.noResults")}
				</h3>
				<p className="text-sm text-muted-foreground">
					{t("boardManager.emptyState.noResultsDescription")}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
			<FolderPlus className="size-12 text-muted-foreground mb-4" />
			<h3 className="text-lg font-medium mb-2">
				{t("boardManager.emptyState.title")}
			</h3>
			<p className="text-sm text-muted-foreground mb-4">
				{t("boardManager.emptyState.description")}
			</p>
			<Button onClick={onCreateNew}>{t("boardManager.newBoard")}</Button>
		</div>
	);
}
