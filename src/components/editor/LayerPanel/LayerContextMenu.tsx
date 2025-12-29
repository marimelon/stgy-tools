/**
 * レイヤーパネル用コンテキストメニューコンポーネント
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { ObjectGroup } from "@/lib/editor/types";
import type { BoardObject } from "@/lib/stgy";
import type { LayerContextMenuState } from "./types";

interface LayerContextMenuProps {
	/** メニュー状態 */
	menuState: LayerContextMenuState;
	/** メニューを閉じるコールバック */
	onClose: () => void;
	/** オブジェクト一覧 */
	objects: BoardObject[];
	/** 選択中のインデックス */
	selectedIndices: number[];
	/** クリップボードにデータがあるか */
	hasClipboard: boolean;
	/** グループ化可能か */
	canGroup: boolean;
	/** グループ状態ヘルパー */
	isGroupAllVisible: (group: ObjectGroup) => boolean;
	isGroupAllLocked: (group: ObjectGroup) => boolean;
	/** フォーカス中のグループID */
	focusedGroupId: string | null;
	/** アクション */
	actions: {
		copy: () => void;
		paste: () => void;
		duplicate: () => void;
		delete: () => void;
		group: () => void;
		ungroup: (groupId: string) => void;
		removeFromGroup: (objectIndex: number) => void;
		toggleVisibility: (index: number) => void;
		toggleLock: (index: number) => void;
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

/**
 * レイヤーコンテキストメニュー
 */
export function LayerContextMenu({
	menuState,
	onClose,
	objects,
	selectedIndices,
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
	const hasSelection = selectedIndices.length > 0;
	const singleSelection = selectedIndices.length === 1;

	// メニュー位置を計算
	useLayoutEffect(() => {
		if (menuState.isOpen && menuRef.current) {
			const menuRect = menuRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let x = menuState.x;
			let y = menuState.y;

			// 右端を超える場合は左に調整
			if (x + menuRect.width > viewportWidth - 8) {
				x = viewportWidth - menuRect.width - 8;
			}

			// 下端を超える場合は上に調整
			if (y + menuRect.height > viewportHeight - 8) {
				y = viewportHeight - menuRect.height - 8;
			}

			// 左端を超えないように
			if (x < 8) {
				x = 8;
			}

			// 上端を超えないように
			if (y < 8) {
				y = 8;
			}

			setPosition({ x, y });
			setIsPositioned(true);
		}
	}, [menuState.isOpen, menuState.x, menuState.y]);

	// 閉じた時にリセット
	useEffect(() => {
		if (!menuState.isOpen) {
			setIsPositioned(false);
		}
	}, [menuState.isOpen]);

	// クリック外で閉じる
	useEffect(() => {
		if (!menuState.isOpen) return;

		const handleClickOutside = (event: MouseEvent | PointerEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		// 次のフレームでリスナーを追加
		const rafId = requestAnimationFrame(() => {
			document.addEventListener("pointerdown", handleClickOutside, true);
		});

		return () => {
			cancelAnimationFrame(rafId);
			document.removeEventListener("pointerdown", handleClickOutside, true);
		};
	}, [menuState.isOpen, onClose]);

	// Escapeキーで閉じる
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

	// Mac判定
	const isMac =
		typeof navigator !== "undefined" &&
		navigator.platform.toUpperCase().indexOf("MAC") >= 0;
	const modKey = isMac ? "⌘" : "Ctrl+";

	// メニュー項目を構築
	const menuItems = useMemo<MenuItemOrDivider[]>(() => {
		if (!target) return [];

		// オブジェクト用メニュー
		if (target.type === "object") {
			const obj = objects[target.index];
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

			// グループ内オブジェクトの場合、グループから除外を追加
			if (target.isInGroup) {
				items.push({
					label: t("layerContextMenu.removeFromGroup"),
					onClick: () => {
						actions.removeFromGroup(target.index);
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
						actions.toggleVisibility(target.index);
						onClose();
					},
				},
				{
					label: obj.flags.locked
						? t("layerContextMenu.unlockObject")
						: t("layerContextMenu.lockObject"),
					onClick: () => {
						actions.toggleLock(target.index);
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

		// グループ用メニュー
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
				// フォーカス/フォーカス解除
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

			// 表示/非表示トグル（全て表示中なら「非表示」、それ以外なら「表示」）
			items.push({
				label: allVisible
					? t("layerContextMenu.hideAll")
					: t("layerContextMenu.showAll"),
				onClick: () => {
					actions.toggleGroupVisibility(group);
					onClose();
				},
			});

			// ロック/解除トグル（全てロック中なら「解除」、それ以外なら「ロック」）
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
