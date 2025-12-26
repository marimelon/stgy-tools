/**
 * 履歴パネルコンポーネント
 *
 * 操作履歴を一覧表示し、任意の時点に移動可能
 */

import { Trash2 } from "lucide-react";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEditor } from "@/lib/editor";
import { HistoryItem } from "./HistoryItem";

/**
 * 履歴パネル
 */
export function HistoryPanel() {
	const { t } = useTranslation();
	const { state, jumpToHistory } = useEditor();
	const { history, historyIndex } = state;
	const listRef = useRef<HTMLDivElement>(null);

	// キーボードナビゲーション（新しい履歴が上なので、↑で新しい方へ、↓で古い方へ）
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "ArrowUp" && historyIndex < history.length - 1) {
				e.preventDefault();
				jumpToHistory(historyIndex + 1);
			} else if (e.key === "ArrowDown" && historyIndex > 0) {
				e.preventDefault();
				jumpToHistory(historyIndex - 1);
			}
		},
		[historyIndex, history.length, jumpToHistory],
	);

	const hasHistory = history.length > 1;

	return (
		<div
			className="flex flex-col h-full"
			style={{ background: "var(--color-bg-base)" }}
		>
			{/* 履歴リスト */}
			<div
				ref={listRef}
				className="flex-1 overflow-y-auto"
				role="listbox"
				aria-label={t("historyPanel.title")}
				tabIndex={0}
				onKeyDown={handleKeyDown}
			>
				{!hasHistory ? (
					<div className="p-4 text-sm text-center text-muted-foreground">
						<div className="text-3xl mb-2 opacity-50">📜</div>
						{t("historyPanel.noHistory")}
					</div>
				) : (
					<div className="py-1">
						{[...history].reverse().map((entry, reversedIndex) => {
							const index = history.length - 1 - reversedIndex;
							return (
								<HistoryItem
									key={entry.id}
									index={index}
									entry={entry}
									isCurrent={index === historyIndex}
									isInitial={index === 0}
									isRedoable={index > historyIndex}
									onClick={() => jumpToHistory(index)}
								/>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

/**
 * 履歴パネルのアクションボタン（ヘッダー用）
 */
export function HistoryPanelActions() {
	const { t } = useTranslation();
	const { state, clearHistory } = useEditor();
	const hasHistory = state.history.length > 1;

	const handleClear = () => {
		if (window.confirm(t("historyPanel.clearConfirm"))) {
			clearHistory();
		}
	};

	return (
		<button
			type="button"
			className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
			onClick={handleClear}
			disabled={!hasHistory}
			title={t("historyPanel.clear")}
		>
			<Trash2 size={14} />
		</button>
	);
}
