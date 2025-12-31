/**
 * サイドバー内のパネルグループ
 *
 * 縦方向にリサイズ可能なパネル分割
 * 折りたたみ機能付き（VSCode風：順番を維持）
 */

import { Fragment, type ReactNode } from "react";
import {
	type Layout,
	Panel,
	Group as PanelGroup,
	Separator as PanelResizeHandle,
	useDefaultLayout,
} from "react-resizable-panels";
import { type PanelConfig, type PanelId, usePanelActions } from "@/lib/panel";
import { PANEL_CONFIG, RESIZE_HANDLE_STYLES } from "./constants";
import { PanelHeader } from "./PanelHeader";

interface SidebarGroupProps {
	/** パネル一覧（ソート済み） */
	panels: [PanelId, PanelConfig][];
	/** パネルコンポーネントのマップ */
	panelComponents: Record<PanelId, ReactNode>;
	/** パネル固有のアクションボタンのマップ */
	panelActions?: Partial<Record<PanelId, ReactNode>>;
	/** localStorage保存用ID */
	storageId: string;
}

/**
 * サイドバー内パネルグループ
 */
export function SidebarGroup({
	panels,
	panelComponents,
	panelActions,
	storageId,
}: SidebarGroupProps) {
	const { togglePanelCollapsed } = usePanelActions();

	// 展開中のパネルを取得
	const expandedPanels = panels.filter(([, config]) => !config.collapsed);
	const expandedCount = expandedPanels.length;

	// 展開中パネルのIDをキーに含める（異なるパネル組み合わせで別々のレイアウトを保存）
	const expandedPanelIds = expandedPanels.map(([id]) => id).join("-");

	// レイアウトの保存・復元
	const { defaultLayout, onLayoutChange } = useDefaultLayout({
		id: `${storageId}-${expandedPanelIds}`,
		storage: localStorage,
	});

	if (panels.length === 0) {
		return null;
	}

	// すべて折りたたまれている場合
	if (expandedCount === 0) {
		return (
			<div className="h-full flex flex-col overflow-hidden">
				{panels.map(([panelId]) => (
					<div key={panelId} className="flex-shrink-0">
						<PanelHeader
							panelId={panelId}
							collapsed={true}
							onToggleCollapse={() => togglePanelCollapsed(panelId)}
							actions={panelActions?.[panelId]}
						/>
					</div>
				))}
			</div>
		);
	}

	// 1つだけ展開されている場合（PanelGroup不要）
	if (expandedCount === 1) {
		return (
			<div className="h-full flex flex-col overflow-hidden">
				{panels.map(([panelId, config]) => {
					const isCollapsed = config.collapsed;
					return (
						<div
							key={panelId}
							className={
								isCollapsed
									? "flex-shrink-0"
									: "flex-1 flex flex-col overflow-hidden min-h-0"
							}
						>
							<PanelHeader
								panelId={panelId}
								collapsed={isCollapsed}
								onToggleCollapse={() => togglePanelCollapsed(panelId)}
								actions={panelActions?.[panelId]}
							/>
							{!isCollapsed && (
								<div className="flex-1 overflow-hidden min-h-0">
									{panelComponents[panelId]}
								</div>
							)}
						</div>
					);
				})}
			</div>
		);
	}

	// 複数展開されている場合：PanelGroupを使用
	// 展開パネルのみをPanelGroupに入れ、折りたたみパネルは固定ヘッダーとして配置
	return (
		<div className="h-full flex flex-col overflow-hidden">
			{renderPanelsWithGroup(
				panels,
				panelComponents,
				panelActions,
				togglePanelCollapsed,
				defaultLayout,
				onLayoutChange,
			)}
		</div>
	);
}

/**
 * パネルをPanelGroupと組み合わせてレンダリング
 * 折りたたみパネルは固定、展開パネルはPanelGroup内でリサイズ可能
 */
function renderPanelsWithGroup(
	panels: [PanelId, PanelConfig][],
	panelComponents: Record<PanelId, ReactNode>,
	panelActions: Partial<Record<PanelId, ReactNode>> | undefined,
	togglePanelCollapsed: (panelId: PanelId) => void,
	defaultLayout: Layout | undefined,
	onLayoutChange: (layout: Layout) => void,
) {
	const elements: ReactNode[] = [];

	// パネルを連続した展開パネルのグループに分割
	let i = 0;
	while (i < panels.length) {
		const [panelId, config] = panels[i];

		if (config.collapsed) {
			// 折りたたみパネル：固定ヘッダー
			elements.push(
				<div key={panelId} className="flex-shrink-0">
					<PanelHeader
						panelId={panelId}
						collapsed={true}
						onToggleCollapse={() => togglePanelCollapsed(panelId)}
						actions={panelActions?.[panelId]}
					/>
				</div>,
			);
			i++;
		} else {
			// 連続する展開パネルを収集
			const expandedGroup: [PanelId, PanelConfig][] = [];
			while (i < panels.length && !panels[i][1].collapsed) {
				expandedGroup.push(panels[i]);
				i++;
			}

			// 展開パネルグループをPanelGroupでラップ
			if (expandedGroup.length === 1) {
				// 1つだけの場合はPanelGroup不要
				const [singlePanelId] = expandedGroup[0];
				elements.push(
					<div
						key={singlePanelId}
						className="flex-1 flex flex-col overflow-hidden min-h-0"
					>
						<PanelHeader
							panelId={singlePanelId}
							collapsed={false}
							onToggleCollapse={() => togglePanelCollapsed(singlePanelId)}
							actions={panelActions?.[singlePanelId]}
						/>
						<div className="flex-1 overflow-hidden min-h-0">
							{panelComponents[singlePanelId]}
						</div>
					</div>,
				);
			} else {
				// 複数の場合はPanelGroupでリサイズ可能に
				elements.push(
					<PanelGroup
						key={`group-${expandedGroup.map(([id]) => id).join("-")}`}
						orientation="vertical"
						className="flex-1 min-h-0"
						defaultLayout={defaultLayout}
						onLayoutChange={onLayoutChange}
					>
						{expandedGroup.map(([gPanelId], gIndex) => (
							<Fragment key={gPanelId}>
								{gIndex > 0 && (
									<PanelResizeHandle
										className={RESIZE_HANDLE_STYLES.VERTICAL}
									/>
								)}
								<Panel
									defaultSize={100 / expandedGroup.length}
									minSize={PANEL_CONFIG.MIN_SIZE_PERCENT}
									id={gPanelId}
								>
									<div className="h-full flex flex-col overflow-hidden">
										<PanelHeader
											panelId={gPanelId}
											collapsed={false}
											onToggleCollapse={() => togglePanelCollapsed(gPanelId)}
											actions={panelActions?.[gPanelId]}
										/>
										<div className="flex-1 overflow-hidden min-h-0">
											{panelComponents[gPanelId]}
										</div>
									</div>
								</Panel>
							</Fragment>
						))}
					</PanelGroup>,
				);
			}
		}
	}

	return elements;
}
