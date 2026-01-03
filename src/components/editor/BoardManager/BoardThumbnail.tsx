/**
 * Board thumbnail component
 * Renders a small preview of the board using BoardViewer
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BoardViewer } from "@/components/board";
import { assignBoardObjectIds, decodeStgy, parseBoardData } from "@/lib/stgy";

export interface BoardThumbnailProps {
	stgyCode: string;
	className?: string;
}

export function BoardThumbnail({ stgyCode, className }: BoardThumbnailProps) {
	const { t } = useTranslation();

	const boardData = useMemo(() => {
		try {
			const binary = decodeStgy(stgyCode);
			const parsed = parseBoardData(binary);
			return assignBoardObjectIds(parsed);
		} catch {
			return null;
		}
	}, [stgyCode]);

	if (!boardData) {
		return (
			<div
				className={`bg-muted flex items-center justify-center text-muted-foreground text-xs ${className ?? ""}`}
			>
				{t("boardManager.thumbnailError")}
			</div>
		);
	}

	return (
		<div
			className={`overflow-hidden [&>svg]:w-full [&>svg]:h-full [&_*]:pointer-events-none ${className ?? ""}`}
		>
			<BoardViewer boardData={boardData} />
		</div>
	);
}
