import { X } from "lucide-react";
import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BoardViewer, CANVAS_HEIGHT, CANVAS_WIDTH } from "@/components/board";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import type { BoardData } from "@/lib/stgy";

interface BoardExpandModalProps {
	boardData: BoardData;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function BoardExpandModal({
	boardData,
	open,
	onOpenChange,
}: BoardExpandModalProps) {
	const { t } = useTranslation();
	const descriptionId = useId();

	const scale = useMemo(() => {
		if (typeof window === "undefined") return 1;
		const maxWidth = window.innerWidth * 0.85 - 48;
		const maxHeight = window.innerHeight * 0.85 - 80;
		const scaleX = maxWidth / CANVAS_WIDTH;
		const scaleY = maxHeight / CANVAS_HEIGHT;
		return Math.min(scaleX, scaleY, 2.5);
	}, []);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="!max-w-none !w-auto p-0 gap-0 overflow-visible bg-transparent border-none shadow-none"
				aria-describedby={descriptionId}
				showCloseButton={false}
			>
				<DialogTitle className="sr-only">
					{boardData.name || t("viewer.boardInfo.unnamed")}
				</DialogTitle>
				<DialogDescription id={descriptionId} className="sr-only">
					{t("viewer.expandModal.description")}
				</DialogDescription>
				<div className="relative">
					<DialogClose className="absolute -top-3 -right-3 z-10 p-1.5 rounded-full bg-card border border-border text-foreground hover:bg-accent transition-colors shadow-md">
						<X className="w-4 h-4" />
						<span className="sr-only">{t("common.close")}</span>
					</DialogClose>
					<div className="rounded-lg overflow-hidden border border-border shadow-lg">
						<BoardViewer boardData={boardData} scale={scale} />
						{boardData.name && (
							<p className="py-2 text-sm text-muted-foreground text-center bg-card">
								{boardData.name}
							</p>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
