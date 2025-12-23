/**
 * 右クリックコンテキストメニューコンポーネント
 */

import { useEffect, useRef, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export interface ContextMenuState {
	isOpen: boolean;
	x: number;
	y: number;
	targetIndex: number | null;
}

interface ContextMenuProps {
	/** メニュー状態 */
	menuState: ContextMenuState;
	/** メニューを閉じるコールバック */
	onClose: () => void;
	/** 選択中のインデックス */
	selectedIndices: number[];
	/** クリップボードにデータがあるか */
	hasClipboard: boolean;
	/** グループ化可能か */
	canGroup: boolean;
	/** 選択中のグループ */
	selectedGroup: { id: string } | undefined;
	/** アクション */
	actions: {
		copy: () => void;
		paste: () => void;
		duplicate: () => void;
		delete: () => void;
		group: () => void;
		ungroup: () => void;
		moveLayer: (direction: "front" | "back" | "forward" | "backward") => void;
		selectAll: () => void;
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
 * コンテキストメニュー
 */
export function ContextMenu({
	menuState,
	onClose,
	selectedIndices,
	hasClipboard,
	canGroup,
	selectedGroup,
	actions,
}: ContextMenuProps) {
	const { t } = useTranslation();
	const menuRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });
	const [isPositioned, setIsPositioned] = useState(false);

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

		// 次のフレームでリスナーを追加（右クリックイベント自体で閉じないように）
		const rafId = requestAnimationFrame(() => {
			// キャプチャフェーズでリッスン（stopPropagationの影響を受けない）
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

	if (!menuState.isOpen) return null;

	const isMac =
		typeof navigator !== "undefined" &&
		navigator.platform.toUpperCase().indexOf("MAC") >= 0;
	const modKey = isMac ? "⌘" : "Ctrl+";

	// メニュー項目を構築
	const menuItems: MenuItemOrDivider[] = [
		{
			label: t("contextMenu.copy"),
			shortcut: `${modKey}C`,
			onClick: () => {
				actions.copy();
				onClose();
			},
			disabled: !hasSelection,
		},
		{
			label: t("contextMenu.paste"),
			shortcut: `${modKey}V`,
			onClick: () => {
				actions.paste();
				onClose();
			},
			disabled: !hasClipboard,
		},
		{
			label: t("contextMenu.duplicate"),
			shortcut: `${modKey}D`,
			onClick: () => {
				actions.duplicate();
				onClose();
			},
			disabled: !hasSelection,
		},
		{
			label: t("contextMenu.delete"),
			shortcut: "Delete",
			onClick: () => {
				actions.delete();
				onClose();
			},
			disabled: !hasSelection,
		},
		{ type: "divider" },
		{
			label: t("contextMenu.group"),
			shortcut: `${modKey}G`,
			onClick: () => {
				actions.group();
				onClose();
			},
			disabled: !canGroup,
		},
		{
			label: t("contextMenu.ungroup"),
			shortcut: `${modKey}${isMac ? "⇧" : "Shift+"}G`,
			onClick: () => {
				if (selectedGroup) {
					actions.ungroup();
					onClose();
				}
			},
			disabled: !selectedGroup,
		},
		{ type: "divider" },
		{
			label: t("contextMenu.bringToFront"),
			onClick: () => {
				actions.moveLayer("front");
				onClose();
			},
			disabled: !singleSelection,
		},
		{
			label: t("contextMenu.bringForward"),
			onClick: () => {
				actions.moveLayer("forward");
				onClose();
			},
			disabled: !singleSelection,
		},
		{
			label: t("contextMenu.sendBackward"),
			onClick: () => {
				actions.moveLayer("backward");
				onClose();
			},
			disabled: !singleSelection,
		},
		{
			label: t("contextMenu.sendToBack"),
			onClick: () => {
				actions.moveLayer("back");
				onClose();
			},
			disabled: !singleSelection,
		},
		{ type: "divider" },
		{
			label: t("contextMenu.selectAll"),
			shortcut: `${modKey}A`,
			onClick: () => {
				actions.selectAll();
				onClose();
			},
		},
	];

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
