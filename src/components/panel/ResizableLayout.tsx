/**
 * リサイズ可能なレイアウトコンポーネント
 *
 * 左サイドバー / 中央キャンバス / 右サイドバーの3分割レイアウト
 * React 19.2の<Activity>を使用して、非表示パネルの状態を保持
 */

import type { ReactNode } from "react";
import { Activity } from "react";
import {
	Panel,
	Group as PanelGroup,
	Separator as PanelResizeHandle,
	useDefaultLayout,
} from "react-resizable-panels";
import { type PanelId, usePanelLayout } from "@/lib/panel";
import { SidebarGroup } from "./SidebarGroup";

interface ResizableLayoutProps {
	/** パネルコンポーネントのマップ */
	panelComponents: Record<PanelId, ReactNode>;
	/** 中央コンテンツ（キャンバス） */
	children: ReactNode;
}

/**
 * リサイズ可能なレイアウト
 */
export function ResizableLayout({
	panelComponents,
	children,
}: ResizableLayoutProps) {
	const { leftPanels, rightPanels, leftHiddenPanels, rightHiddenPanels } =
		usePanelLayout();

	const hasLeftSidebar = leftPanels.length > 0;
	const hasRightSidebar = rightPanels.length > 0;

	// 非表示パネル（左右合わせて）
	const hiddenPanels = [...leftHiddenPanels, ...rightHiddenPanels];

	// レイアウトの保存・復元
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
				{/* 左サイドバー */}
				{hasLeftSidebar && (
					<>
						{/* biome-ignore lint/correctness/useUniqueElementIds: Panel IDs must be static for layout persistence */}
						<Panel
							defaultSize="20%"
							minSize="150px"
							maxSize="50%"
							id="left-sidebar"
						>
							<SidebarGroup
								panels={leftPanels}
								panelComponents={panelComponents}
								storageId="editor-left-sidebar"
							/>
						</Panel>
						<PanelResizeHandle className="w-1 bg-slate-700 hover:bg-cyan-500 transition-colors cursor-col-resize" />
					</>
				)}

				{/* 中央（キャンバス） */}
				{/* biome-ignore lint/correctness/useUniqueElementIds: Panel IDs must be static for layout persistence */}
				<Panel minSize="20%" id="center">
					{children}
				</Panel>

				{/* 右サイドバー */}
				{hasRightSidebar && (
					<>
						<PanelResizeHandle className="w-1 bg-slate-700 hover:bg-cyan-500 transition-colors cursor-col-resize" />
						{/* biome-ignore lint/correctness/useUniqueElementIds: Panel IDs must be static for layout persistence */}
						<Panel
							defaultSize="22%"
							minSize="200px"
							maxSize="50%"
							id="right-sidebar"
						>
							<SidebarGroup
								panels={rightPanels}
								panelComponents={panelComponents}
								storageId="editor-right-sidebar"
							/>
						</Panel>
					</>
				)}
			</PanelGroup>

			{/* 非表示パネル: Activityで状態を保持しつつ非表示 */}
			{hiddenPanels.map(([panelId]) => (
				<Activity key={panelId} mode="hidden">
					{panelComponents[panelId]}
				</Activity>
			))}
		</>
	);
}
