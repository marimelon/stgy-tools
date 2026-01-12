/**
 * Panel header component with collapse toggle functionality
 */

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PanelId } from "@/lib/panel";

const ICON_SIZE = 14;

interface PanelHeaderProps {
	panelId: PanelId;
	collapsed: boolean;
	onToggleCollapse: () => void;
	actions?: ReactNode;
}

export function PanelHeader({
	panelId,
	collapsed,
	onToggleCollapse,
	actions,
}: PanelHeaderProps) {
	const { t } = useTranslation();
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
						? t("panel.expand", "Expand")
						: t("panel.collapse", "Collapse")
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
