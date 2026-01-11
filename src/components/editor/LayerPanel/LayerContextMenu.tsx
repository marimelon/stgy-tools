/**
 * Layer panel context menu component
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { ObjectGroup } from "@/lib/editor/types";
import type { BoardObject } from "@/lib/stgy";
import type { LayerContextMenuState } from "./types";

interface LayerContextMenuProps {
	menuState: LayerContextMenuState;
	onClose: () => void;
	objects: BoardObject[];
	selectedIds: string[];
	hasClipboard: boolean;
	canGroup: boolean;
	isGroupAllVisible: (group: ObjectGroup) => boolean;
	isGroupAllLocked: (group: ObjectGroup) => boolean;
	focusedGroupId: string | null;
	actions: {
		copy: () => void;
		paste: () => void;
		duplicate: () => void;
		delete: () => void;
		group: () => void;
		ungroup: (groupId: string) => void;
		removeFromGroup: (objectId: string) => void;
		toggleVisibility: (objectId: string) => void;
		toggleLock: (objectId: string) => void;
		toggleGroupVisibility: (group: ObjectGroup) => void;
		toggleGroupLock: (group: ObjectGroup) => void;
		moveLayer: (direction: "front" | "back" | "forward" | "backward") => void;
		startRenameGroup: (groupId: string) => void;
		toggleGroupCollapse: (groupId: string) => void;
		focusGroup: (groupId: string) => void;
		unfocus: () => void;
	};
}

interface MenuItem {
	label: string;
	shortcut?: string;
	onClick: () => void;
	disabled?: boolean;
}

interface MenuDivider {
	type: "divider";
}

type MenuItemOrDivider = MenuItem | MenuDivider;

function isDivider(item: MenuItemOrDivider): item is MenuDivider {
	return "type" in item && item.type === "divider";
}

export function LayerContextMenu({
	menuState,
	onClose,
	objects,
	selectedIds,
	hasClipboard,
	canGroup,
	isGroupAllVisible,
	isGroupAllLocked,
	focusedGroupId,
	actions,
}: LayerContextMenuProps) {
	const { t } = useTranslation();
	const menuRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isPositioned, setIsPositioned] = useState(false);

	const { target } = menuState;
	const hasSelection = selectedIds.length > 0;
	const singleSelection = selectedIds.length === 1;

	useLayoutEffect(() => {
		if (menuState.isOpen && menuRef.current) {
			const menuRect = menuRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let x = menuState.x;
			let y = menuState.y;

			if (x + menuRect.width > viewportWidth - 8) {
				x = viewportWidth - menuRect.width - 8;
			}

			if (y + menuRect.height > viewportHeight - 8) {
				y = viewportHeight - menuRect.height - 8;
			}

			if (x < 8) {
				x = 8;
			}

			if (y < 8) {
				y = 8;
			}

			setPosition({ x, y });
			setIsPositioned(true);
		}
	}, [menuState.isOpen, menuState.x, menuState.y]);

	useEffect(() => {
		if (!menuState.isOpen) {
			setIsPositioned(false);
		}
	}, [menuState.isOpen]);

	useEffect(() => {
		if (!menuState.isOpen) return;

		const handleClickOutside = (event: MouseEvent | PointerEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		const rafId = requestAnimationFrame(() => {
			document.addEventListener("pointerdown", handleClickOutside, true);
		});

		return () => {
			cancelAnimationFrame(rafId);
			document.removeEventListener("pointerdown", handleClickOutside, true);
		};
	}, [menuState.isOpen, onClose]);

	useEffect(() => {
		if (!menuState.isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [menuState.isOpen, onClose]);

	const isMac =
		typeof navigator !== "undefined" &&
		navigator.platform.toUpperCase().indexOf("MAC") >= 0;
	const modKey = isMac ? "⌘" : "Ctrl+";

	const menuItems = useMemo<MenuItemOrDivider[]>(() => {
		if (!target) return [];

		if (target.type === "object") {
			const obj = objects.find((o) => o.id === target.objectId);
			if (!obj) return [];

			const items: MenuItemOrDivider[] = [
				{
					label: t("layerContextMenu.copy"),
					shortcut: `${modKey}C`,
					onClick: () => {
						actions.copy();
						onClose();
					},
					disabled: !hasSelection,
				},
				{
					label: t("layerContextMenu.paste"),
					shortcut: `${modKey}V`,
					onClick: () => {
						actions.paste();
						onClose();
					},
					disabled: !hasClipboard,
				},
				{
					label: t("layerContextMenu.duplicate"),
					shortcut: `${modKey}D`,
					onClick: () => {
						actions.duplicate();
						onClose();
					},
					disabled: !hasSelection,
				},
				{
					label: t("layerContextMenu.delete"),
					shortcut: "Delete",
					onClick: () => {
						actions.delete();
						onClose();
					},
					disabled: !hasSelection,
				},
				{ type: "divider" },
				{
					label: t("layerContextMenu.group"),
					shortcut: `${modKey}G`,
					onClick: () => {
						actions.group();
						onClose();
					},
					disabled: !canGroup,
				},
			];

			if (target.isInGroup) {
				items.push({
					label: t("layerContextMenu.removeFromGroup"),
					onClick: () => {
						actions.removeFromGroup(target.objectId);
						onClose();
					},
				});
			}

			items.push(
				{ type: "divider" },
				{
					label: obj.flags.visible
						? t("layerContextMenu.hideObject")
						: t("layerContextMenu.showObject"),
					onClick: () => {
						actions.toggleVisibility(target.objectId);
						onClose();
					},
				},
				{
					label: obj.flags.locked
						? t("layerContextMenu.unlockObject")
						: t("layerContextMenu.lockObject"),
					onClick: () => {
						actions.toggleLock(target.objectId);
						onClose();
					},
				},
				{ type: "divider" },
				{
					label: t("layerContextMenu.bringToFront"),
					onClick: () => {
						actions.moveLayer("front");
						onClose();
					},
					disabled: !singleSelection,
				},
				{
					label: t("layerContextMenu.bringForward"),
					onClick: () => {
						actions.moveLayer("forward");
						onClose();
					},
					disabled: !singleSelection,
				},
				{
					label: t("layerContextMenu.sendBackward"),
					onClick: () => {
						actions.moveLayer("backward");
						onClose();
					},
					disabled: !singleSelection,
				},
				{
					label: t("layerContextMenu.sendToBack"),
					onClick: () => {
						actions.moveLayer("back");
						onClose();
					},
					disabled: !singleSelection,
				},
			);

			return items;
		}

		if (target.type === "group") {
			const { group } = target;
			const allVisible = isGroupAllVisible(group);
			const allLocked = isGroupAllLocked(group);
			const isFocused = focusedGroupId === group.id;

			const items: MenuItemOrDivider[] = [
				{
					label: t("layerContextMenu.renameGroup"),
					onClick: () => {
						actions.startRenameGroup(group.id);
						onClose();
					},
				},
				{
					label: t("layerContextMenu.ungroup"),
					shortcut: `${modKey}${isMac ? "⇧" : "Shift+"}G`,
					onClick: () => {
						actions.ungroup(group.id);
						onClose();
					},
				},
				{ type: "divider" },
				{
					label: isFocused
						? t("layerContextMenu.exitFocus")
						: t("layerContextMenu.focusGroup"),
					onClick: () => {
						if (isFocused) {
							actions.unfocus();
						} else {
							actions.focusGroup(group.id);
						}
						onClose();
					},
				},
				{ type: "divider" },
			];

			items.push({
				label: allVisible
					? t("layerContextMenu.hideAll")
					: t("layerContextMenu.showAll"),
				onClick: () => {
					actions.toggleGroupVisibility(group);
					onClose();
				},
			});

			items.push({
				label: allLocked
					? t("layerContextMenu.unlockAll")
					: t("layerContextMenu.lockAll"),
				onClick: () => {
					actions.toggleGroupLock(group);
					onClose();
				},
			});

			items.push(
				{ type: "divider" },
				{
					label: group.collapsed
						? t("layerContextMenu.expand")
						: t("layerContextMenu.collapse"),
					onClick: () => {
						actions.toggleGroupCollapse(group.id);
						onClose();
					},
				},
			);

			return items;
		}

		return [];
	}, [
		target,
		objects,
		t,
		modKey,
		isMac,
		hasSelection,
		hasClipboard,
		canGroup,
		singleSelection,
		isGroupAllVisible,
		isGroupAllLocked,
		focusedGroupId,
		actions,
		onClose,
	]);

	if (!menuState.isOpen || menuItems.length === 0) return null;

	return createPortal(
		<div
			ref={menuRef}
			className="fixed bg-slate-800 border border-slate-600 rounded shadow-lg z-[9999] min-w-[180px] py-1"
			style={{
				left: position.x,
				top: position.y,
				visibility: isPositioned ? "visible" : "hidden",
			}}
		>
			{menuItems.map((item, index) => {
				if (isDivider(item)) {
					return (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: dividerは固定順序で識別子を持たないためindexを使用
							key={`divider-${index}`}
							className="border-t border-slate-600 my-1"
						/>
					);
				}

				return (
					<button
						key={item.label}
						type="button"
						onClick={item.onClick}
						disabled={item.disabled}
						className="w-full px-3 py-1.5 text-sm text-left text-slate-200 hover:bg-slate-700 disabled:text-slate-500 disabled:hover:bg-transparent flex items-center justify-between gap-4"
					>
						<span>{item.label}</span>
						{item.shortcut && (
							<span className="text-xs text-slate-400">{item.shortcut}</span>
						)}
					</button>
				);
			})}
		</div>,
		document.body,
	);
}
