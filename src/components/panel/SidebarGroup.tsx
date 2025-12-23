/**
 * サイドバー内のパネルグループ
 *
 * 縦方向にリサイズ可能なパネル分割
 */

import { Fragment, type ReactNode } from "react";
import {
	Panel,
	Group as PanelGroup,
	Separator as PanelResizeHandle,
	useDefaultLayout,
} from "react-resizable-panels";
import type { PanelConfig, PanelId } from "@/lib/panel";

interface SidebarGroupProps {
	/** パネル一覧（ソート済み） */
	panels: [PanelId, PanelConfig][];
	/** パネルコンポーネントのマップ */
	panelComponents: Record<PanelId, ReactNode>;
	/** localStorage保存用ID */
	storageId: string;
}

/**
 * サイドバー内パネルグループ
 */
export function SidebarGroup({
	panels,
	panelComponents,
	storageId,
}: SidebarGroupProps) {
	// レイアウトの保存・復元
	const { defaultLayout, onLayoutChange } = useDefaultLayout({
		id: storageId,
		storage: localStorage,
	});

	if (panels.length === 0) {
		return null;
	}

	// パネルが1つの場合はPanelGroupなしでそのまま表示
	if (panels.length === 1) {
		const [panelId] = panels[0];
		return <div className="h-full">{panelComponents[panelId]}</div>;
	}

	// 複数パネルの場合は縦分割
	return (
		<PanelGroup
			orientation="vertical"
			className="h-full"
			defaultLayout={defaultLayout}
			onLayoutChange={onLayoutChange}
		>
			{panels.map(([panelId], index) => (
				<Fragment key={panelId}>
					{index > 0 && (
						<PanelResizeHandle className="h-1 bg-slate-700 hover:bg-cyan-500 transition-colors cursor-row-resize" />
					)}
					<Panel
						defaultSize={`${100 / panels.length}%`}
						minSize="50px"
						id={panelId}
					>
						<div className="h-full overflow-hidden">
							{panelComponents[panelId]}
						</div>
					</Panel>
				</Fragment>
			))}
		</PanelGroup>
	);
}
