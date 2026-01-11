/**
 * Sidebar panel group with vertical resizing and collapse functionality.
 * VSCode-style: maintains panel order.
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
	panels: [PanelId, PanelConfig][];
	panelComponents: Record<PanelId, ReactNode>;
	panelActions?: Partial<Record<PanelId, ReactNode>>;
	storageId: string;
}

export function SidebarGroup({
	panels,
	panelComponents,
	panelActions,
	storageId,
}: SidebarGroupProps) {
	const { togglePanelCollapsed } = usePanelActions();

	const expandedPanels = panels.filter(([, config]) => !config.collapsed);
	const expandedCount = expandedPanels.length;

	// Include expanded panel IDs in key for separate layout storage per combination
	const expandedPanelIds = expandedPanels.map(([id]) => id).join("-");

	const { defaultLayout, onLayoutChange } = useDefaultLayout({
		id: `${storageId}-${expandedPanelIds}`,
		storage: localStorage,
	});

	if (panels.length === 0) {
		return null;
	}

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
 * Render panels with PanelGroup. Collapsed panels are fixed headers,
 * expanded panels are resizable within PanelGroup.
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

	let i = 0;
	while (i < panels.length) {
		const [panelId, config] = panels[i];

		if (config.collapsed) {
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
			const expandedGroup: [PanelId, PanelConfig][] = [];
			while (i < panels.length && !panels[i][1].collapsed) {
				expandedGroup.push(panels[i]);
				i++;
			}

			if (expandedGroup.length === 1) {
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
