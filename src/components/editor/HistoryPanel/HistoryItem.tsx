/**
 * 履歴アイテムコンポーネント
 */

import { Circle, CircleDot, History } from "lucide-react";
import type { HistoryEntry } from "@/lib/editor/types";

interface HistoryItemProps {
	index: number;
	entry: HistoryEntry;
	isCurrent: boolean;
	isInitial: boolean;
	isRedoable: boolean;
	onClick: () => void;
}

/**
 * 履歴パネルの各エントリ
 */
export function HistoryItem({
	entry,
	isCurrent,
	isInitial,
	isRedoable,
	onClick,
}: HistoryItemProps) {
	// アイコンの選択
	const Icon = isInitial ? History : isCurrent ? CircleDot : Circle;
	const iconColor = isCurrent
		? "text-primary"
		: isInitial
			? "text-muted-foreground"
			: "text-muted-foreground";

	return (
		<button
			type="button"
			role="option"
			aria-selected={isCurrent}
			className={`
				w-full px-3 py-1.5 text-left text-sm flex items-center gap-2
				hover:bg-muted/50 transition-colors
				border-l-2
				${isCurrent ? "bg-primary/10 border-primary" : "border-transparent"}
				${isRedoable ? "opacity-50" : ""}
			`}
			onClick={onClick}
			title={entry.description}
		>
			{/* アイコン */}
			<Icon size={14} className={iconColor} />

			{/* 説明テキスト */}
			<span className="flex-1 truncate">{entry.description}</span>
		</button>
	);
}
