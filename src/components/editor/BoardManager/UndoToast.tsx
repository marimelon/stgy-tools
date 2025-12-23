/**
 * Undo toast component for deleted boards
 */

import { useTranslation } from "react-i18next";
import { Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UndoToastProps {
	boardName: string;
	onUndo: () => void;
	onDismiss: () => void;
}

export function UndoToast({ boardName, onUndo, onDismiss }: UndoToastProps) {
	const { t } = useTranslation();

	return (
		<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-foreground text-background shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
			<span className="text-sm">
				{t("boardManager.undoDelete", { name: boardName })}
			</span>
			<Button
				variant="secondary"
				size="sm"
				onClick={onUndo}
				className="h-7 px-2 bg-background/20 hover:bg-background/30 text-background"
			>
				<Undo2 className="size-4 mr-1" />
				{t("boardManager.undo")}
			</Button>
			<button
				type="button"
				onClick={onDismiss}
				className="text-background/70 hover:text-background transition-colors"
			>
				<X className="size-4" />
			</button>
		</div>
	);
}
