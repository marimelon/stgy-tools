/**
 * パネルヘッダーコンポーネント
 *
 * 折りたたみトグル機能付きの共通パネルヘッダー
 */

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PanelId } from "@/lib/panel";

/** アイコンサイズ */
const ICON_SIZE = 14;

interface PanelHeaderProps {
	/** パネルID */
	panelId: PanelId;
	/** 折りたたみ状態 */
	collapsed: boolean;
	/** 折りたたみトグルコールバック */
	onToggleCollapse: () => void;
	/** パネル固有のアクションボタン（オプション） */
	actions?: ReactNode;
}

/**
 * パネルヘッダー
 */
export function PanelHeader({
	panelId,
	collapsed,
	onToggleCollapse,
	actions,
}: PanelHeaderProps) {
	const { t } = useTranslation();

	// i18nからパネル名を取得
	const title = t(`panel.${panelId}`);

	return (
		<div className="panel-header flex items-center justify-between flex-shrink-0">
			<button
				type="button"
				className="flex items-center gap-1.5 flex-1 text-left hover:text-slate-100 transition-colors"
				onClick={onToggleCollapse}
				aria-expanded={!collapsed}
				aria-label={
					collapsed
						? t("panel.expand", "展開")
						: t("panel.collapse", "折りたたむ")
				}
			>
				{collapsed ? (
					<ChevronRight size={ICON_SIZE} className="text-slate-400" />
				) : (
					<ChevronDown size={ICON_SIZE} className="text-slate-400" />
				)}
				<h2 className="panel-title">{title}</h2>
			</button>
			{!collapsed && actions && (
				<div className="flex items-center gap-1">{actions}</div>
			)}
		</div>
	);
}
