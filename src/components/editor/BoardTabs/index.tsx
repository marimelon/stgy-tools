/**
 * Board tabs bar component
 */

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
	horizontalListSortingStrategy,
	SortableContext,
} from "@dnd-kit/sortable";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { StoredBoard } from "@/lib/boards/schema";
import {
	useActiveTabId,
	useIsAtTabLimit,
	useOpenTabs,
	useTabActions,
} from "@/lib/editor/tabs";
import { cn } from "@/lib/utils";
import { BoardTab } from "./BoardTab";
import { TabContextMenu } from "./TabContextMenu";
import type { TabInfo } from "./types";

interface BoardTabsProps {
	/** All available boards */
	boards: StoredBoard[];
	/** Board IDs with unsaved changes */
	unsavedBoardIds: Set<string>;
	/** Called when add button is clicked */
	onAddClick: () => void;
	/** Called when a board is selected */
	onSelectBoard: (boardId: string) => void;
	/** Called to duplicate a board */
	onDuplicateBoard: (boardId: string) => void;
}

export function BoardTabs({
	boards,
	unsavedBoardIds,
	onAddClick,
	onSelectBoard,
	onDuplicateBoard,
}: BoardTabsProps) {
	const { t } = useTranslation();
	const openTabs = useOpenTabs();
	const activeTabId = useActiveTabId();
	const isAtLimit = useIsAtTabLimit();
	const { switchTab, closeTab, closeOtherTabs, closeTabsToRight, reorderTabs } =
		useTabActions();

	// Scroll state
	const containerRef = useRef<HTMLDivElement>(null);
	const tabsRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);

	// Context menu state
	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
		tabId: string;
	} | null>(null);

	// dnd-kit sensors - require some movement before drag starts
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	// Build tab info from open tabs (without isActive to avoid re-renders on tab switch)
	const tabs: TabInfo[] = useMemo(() => {
		const boardMap = new Map(boards.map((b) => [b.id, b]));
		return openTabs
			.map((id) => {
				const board = boardMap.get(id);
				if (!board) return null;
				return {
					id: board.id,
					name: board.name,
					hasUnsavedChanges: unsavedBoardIds.has(id),
				};
			})
			.filter((tab): tab is TabInfo => tab !== null);
	}, [openTabs, boards, unsavedBoardIds]);

	// Tab IDs for SortableContext
	const tabIds = useMemo(() => tabs.map((t) => t.id), [tabs]);

	// Check scroll state
	const updateScrollState = useCallback(() => {
		const tabs = tabsRef.current;
		if (!tabs) return;

		setCanScrollLeft(tabs.scrollLeft > 0);
		setCanScrollRight(
			tabs.scrollLeft < tabs.scrollWidth - tabs.clientWidth - 1,
		);
	}, []);

	// Update scroll state on resize and tab changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: openTabs triggers scroll recalc when tabs change
	useEffect(() => {
		updateScrollState();
		const tabs = tabsRef.current;
		if (!tabs) return;

		const observer = new ResizeObserver(updateScrollState);
		observer.observe(tabs);

		return () => observer.disconnect();
	}, [updateScrollState, openTabs]);

	const handleScroll = useCallback(
		(direction: "left" | "right") => {
			const tabs = tabsRef.current;
			if (!tabs) return;

			const scrollAmount = 150;
			tabs.scrollBy({
				left: direction === "left" ? -scrollAmount : scrollAmount,
				behavior: "smooth",
			});
			setTimeout(updateScrollState, 300);
		},
		[updateScrollState],
	);

	const handleTabSelect = useCallback(
		(tabId: string) => {
			if (tabId !== activeTabId) {
				switchTab(tabId);
				onSelectBoard(tabId);
			}
		},
		[activeTabId, switchTab, onSelectBoard],
	);

	const handleTabClose = useCallback(
		(tabId: string) => {
			const wasActive = tabId === activeTabId;
			const tabIndex = openTabs.indexOf(tabId);
			const closed = closeTab(tabId);

			// If we closed the active tab, switch to the new active tab
			if (closed && wasActive) {
				// Determine which tab became active (same logic as closeTab action)
				const remainingTabs = openTabs.filter((id) => id !== tabId);
				if (remainingTabs.length > 0) {
					const newActiveId =
						tabIndex < remainingTabs.length
							? remainingTabs[tabIndex]
							: remainingTabs[remainingTabs.length - 1];
					onSelectBoard(newActiveId);
				}
			}
		},
		[closeTab, activeTabId, openTabs, onSelectBoard],
	);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent, tabId: string) => {
			e.preventDefault();
			setContextMenu({ x: e.clientX, y: e.clientY, tabId });
		},
		[],
	);

	const handleContextMenuClose = useCallback(() => {
		setContextMenu(null);
	}, []);

	const handleContextMenuAction = useCallback(
		(action: string, tabId: string) => {
			switch (action) {
				case "duplicate":
					onDuplicateBoard(tabId);
					break;
				case "close":
					handleTabClose(tabId);
					break;
				case "closeOthers":
					closeOtherTabs(tabId);
					break;
				case "closeRight":
					closeTabsToRight(tabId);
					break;
			}
			setContextMenu(null);
		},
		[handleTabClose, closeOtherTabs, closeTabsToRight, onDuplicateBoard],
	);

	// Handle drag end from dnd-kit
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;

			if (over && active.id !== over.id) {
				const oldIndex = openTabs.indexOf(String(active.id));
				const newIndex = openTabs.indexOf(String(over.id));

				if (oldIndex !== -1 && newIndex !== -1) {
					reorderTabs(oldIndex, newIndex);
				}
			}
		},
		[openTabs, reorderTabs],
	);

	const isOnlyTab = tabs.length === 1;
	const contextMenuTab = contextMenu
		? tabs.find((t) => t.id === contextMenu.tabId)
		: null;
	const contextMenuIndex = contextMenu
		? tabs.findIndex((t) => t.id === contextMenu.tabId)
		: -1;

	return (
		<div
			ref={containerRef}
			className="flex items-end border-t border-border bg-muted/30"
		>
			{/* Scroll left button - always rendered to avoid layout shift */}
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					"h-8 w-6 rounded-none shrink-0 transition-opacity",
					canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none",
				)}
				onClick={() => handleScroll("left")}
				tabIndex={canScrollLeft ? 0 : -1}
			>
				<ChevronLeft className="size-4" />
			</Button>

			{/* Tabs container with dnd-kit */}
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				modifiers={[restrictToHorizontalAxis]}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={tabIds}
					strategy={horizontalListSortingStrategy}
				>
					<div
						ref={tabsRef}
						className="flex-1 flex items-end overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
						onScroll={updateScrollState}
					>
						{tabs.map((tab) => (
							<div key={tab.id} data-tab-id={tab.id}>
								<BoardTab
									tab={tab}
									isActive={tab.id === activeTabId}
									isOnlyTab={isOnlyTab}
									onSelect={() => handleTabSelect(tab.id)}
									onClose={() => handleTabClose(tab.id)}
									onMiddleClick={() => handleTabClose(tab.id)}
									onContextMenu={(e) => handleContextMenu(e, tab.id)}
								/>
							</div>
						))}
					</div>
				</SortableContext>
			</DndContext>

			{/* Scroll right button - always rendered to avoid layout shift */}
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					"h-8 w-6 rounded-none shrink-0 transition-opacity",
					canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none",
				)}
				onClick={() => handleScroll("right")}
				tabIndex={canScrollRight ? 0 : -1}
			>
				<ChevronRight className="size-4" />
			</Button>

			{/* Add button */}
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					"h-8 w-8 rounded-none shrink-0 border-l border-border",
					isAtLimit && "opacity-50 cursor-not-allowed",
				)}
				onClick={onAddClick}
				disabled={isAtLimit}
				title={isAtLimit ? t("boardTabs.limitReached") : t("boardTabs.addTab")}
			>
				<Plus className="size-4" />
			</Button>

			{/* Context menu */}
			{contextMenu && contextMenuTab && (
				<TabContextMenu
					x={contextMenu.x}
					y={contextMenu.y}
					isOnlyTab={isOnlyTab}
					isLastTab={contextMenuIndex === tabs.length - 1}
					onAction={(action) =>
						handleContextMenuAction(action, contextMenu.tabId)
					}
					onClose={handleContextMenuClose}
				/>
			)}
		</div>
	);
}

export type { TabInfo } from "./types";
