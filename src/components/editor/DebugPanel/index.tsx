/**
 * デバッグパネルコンポーネント
 *
 * BoardDataをJSON形式で直接編集できるデバッグ用パネル
 */

import { useTranslation } from "react-i18next";
import { type SyncStatus, useDebugPanelState } from "./useDebugPanelState";

/**
 * 同期ステータスバッジ
 */
function SyncStatusBadge({ status }: { status: SyncStatus }) {
	const { t } = useTranslation();

	const styles = {
		synced: "bg-green-500/20 text-green-400",
		pending: "bg-yellow-500/20 text-yellow-400",
		error: "bg-red-500/20 text-red-400",
	};

	const labels = {
		synced: t("debugPanel.synced", "Synced"),
		pending: t("debugPanel.pending", "Pending..."),
		error: t("debugPanel.error", "Error"),
	};

	return (
		<span className={`px-2 py-0.5 rounded text-xs ${styles[status]}`}>
			{labels[status]}
		</span>
	);
}

/**
 * デバッグパネル
 */
export function DebugPanel() {
	const { jsonString, setJsonString, syncStatus, validationErrors } =
		useDebugPanelState();

	return (
		<div
			className="flex flex-col h-full"
			style={{ background: "var(--color-bg-base)" }}
		>
			{/* ステータスバー */}
			<div className="px-3 py-1.5 border-b border-slate-700 flex items-center justify-between text-xs">
				<span className="text-slate-400">BoardData JSON</span>
				<SyncStatusBadge status={syncStatus} />
			</div>

			{/* JSONエディタ */}
			<div className="flex-1 overflow-hidden">
				<textarea
					value={jsonString}
					onChange={(e) => setJsonString(e.target.value)}
					className={`w-full h-full p-2 font-mono text-xs resize-none bg-slate-900 text-slate-100 focus:outline-none ${
						syncStatus === "error" ? "ring-2 ring-red-500 ring-inset" : ""
					}`}
					spellCheck={false}
				/>
			</div>

			{/* エラー表示 */}
			{validationErrors && (
				<div className="p-2 border-t border-slate-700 bg-red-900/30 text-red-400 text-xs max-h-24 overflow-auto">
					{validationErrors.map((error, i) => (
						<div key={`error-${i}-${error.slice(0, 20)}`}>{error}</div>
					))}
				</div>
			)}
		</div>
	);
}
