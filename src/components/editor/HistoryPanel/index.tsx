/**
 * History panel component
 *
 * Displays operation history as a list and allows navigation to any point
 */

import { Trash2 } from "lucide-react";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useEditorActions, useHistory } from "@/lib/editor";
import { HistoryItem } from "./HistoryItem";

/**
 * History panel
 */
export function HistoryPanel() {
	const { t } = useTranslation();
	const { history, historyIndex } = useHistory();
	const { jumpToHistory } = useEditorActions();
	const listRef = useRef<HTMLDivElement>(null);

	// Keyboard navigation (newer history is at top, so arrow up goes to newer, arrow down goes to older)
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
			{/* History list */}
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
 * Action button for history panel header
 */
export function HistoryPanelActions() {
	const { t } = useTranslation();
	const { history } = useHistory();
	const { clearHistory } = useEditorActions();
	const hasHistory = history.length > 1;

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
