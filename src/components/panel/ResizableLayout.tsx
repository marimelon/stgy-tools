/**
 * Resizable layout component.
 * 3-column layout: left sidebar / center canvas / right sidebar.
 * Uses React 19.2 <Activity> to preserve hidden panel state.
 */

import type { ReactNode } from "react";
import { Activity } from "react";
import {
	Panel,
	Group as PanelGroup,
	Separator as PanelResizeHandle,
	useDefaultLayout,
} from "react-resizable-panels";
import {
	type PanelId,
	useLeftHiddenPanels,
	useLeftPanels,
	useRightHiddenPanels,
	useRightPanels,
} from "@/lib/panel";
import {
	CENTER_PANEL_CONFIG,
	RESIZE_HANDLE_STYLES,
	SIDEBAR_CONFIG,
} from "./constants";
import { SidebarGroup } from "./SidebarGroup";

interface ResizableLayoutProps {
	panelComponents: Record<PanelId, ReactNode>;
	panelActions?: Partial<Record<PanelId, ReactNode>>;
	children: ReactNode;
}

export function ResizableLayout({
	panelComponents,
	panelActions,
	children,
}: ResizableLayoutProps) {
	const leftPanels = useLeftPanels();
	const rightPanels = useRightPanels();
	const leftHiddenPanels = useLeftHiddenPanels();
	const rightHiddenPanels = useRightHiddenPanels();

	const hasLeftSidebar = leftPanels.length > 0;
	const hasRightSidebar = rightPanels.length > 0;

	const hiddenPanels = [...leftHiddenPanels, ...rightHiddenPanels];

	const { defaultLayout, onLayoutChange } = useDefaultLayout({
		id: "editor-main-layout",
		storage: localStorage,
	});

	return (
		<>
			<PanelGroup
				orientation="horizontal"
				className="h-full"
				defaultLayout={defaultLayout}
				onLayoutChange={onLayoutChange}
			>
				{hasLeftSidebar && (
					<>
						{/* biome-ignore lint/correctness/useUniqueElementIds: Panel IDs must be static for layout persistence */}
						<Panel
							defaultSize={SIDEBAR_CONFIG.LEFT_DEFAULT_SIZE}
							minSize={SIDEBAR_CONFIG.LEFT_MIN_SIZE}
							maxSize={SIDEBAR_CONFIG.MAX_SIZE}
							id="left-sidebar"
						>
							<SidebarGroup
								panels={leftPanels}
								panelComponents={panelComponents}
								panelActions={panelActions}
								storageId="editor-left-sidebar"
							/>
						</Panel>
						<PanelResizeHandle className={RESIZE_HANDLE_STYLES.HORIZONTAL} />
					</>
				)}

				{/* biome-ignore lint/correctness/useUniqueElementIds: Panel IDs must be static for layout persistence */}
				<Panel minSize={CENTER_PANEL_CONFIG.MIN_SIZE} id="center">
					{children}
				</Panel>

				{hasRightSidebar && (
					<>
						<PanelResizeHandle className={RESIZE_HANDLE_STYLES.HORIZONTAL} />
						{/* biome-ignore lint/correctness/useUniqueElementIds: Panel IDs must be static for layout persistence */}
						<Panel
							defaultSize={SIDEBAR_CONFIG.RIGHT_DEFAULT_SIZE}
							minSize={SIDEBAR_CONFIG.RIGHT_MIN_SIZE}
							maxSize={SIDEBAR_CONFIG.MAX_SIZE}
							id="right-sidebar"
						>
							<SidebarGroup
								panels={rightPanels}
								panelComponents={panelComponents}
								panelActions={panelActions}
								storageId="editor-right-sidebar"
							/>
						</Panel>
					</>
				)}
			</PanelGroup>

			{/* Hidden panels: Activity preserves state while hidden */}
			{hiddenPanels.map(([panelId]) => (
				<Activity key={panelId} mode="hidden">
					{panelComponents[panelId]}
				</Activity>
			))}
		</>
	);
}
