/**
 * Tab context menu component
 */

import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface TabContextMenuProps {
	x: number;
	y: number;
	isOnlyTab: boolean;
	isLastTab: boolean;
	onAction: (action: string) => void;
	onClose: () => void;
}

interface MenuItem {
	id: string;
	label: string;
	disabled?: boolean;
}

export function TabContextMenu({
	x,
	y,
	isOnlyTab,
	isLastTab,
	onAction,
	onClose,
}: TabContextMenuProps) {
	const { t } = useTranslation();
	const menuRef = useRef<HTMLDivElement>(null);

	const menuItems: MenuItem[] = [
		{ id: "duplicate", label: t("boardTabs.contextMenu.duplicate") },
		{ id: "divider", label: "" },
		{
			id: "close",
			label: t("boardTabs.contextMenu.close"),
			disabled: isOnlyTab,
		},
		{
			id: "closeOthers",
			label: t("boardTabs.contextMenu.closeOthers"),
			disabled: isOnlyTab,
		},
		{
			id: "closeRight",
			label: t("boardTabs.contextMenu.closeRight"),
			disabled: isLastTab,
		},
	];

	// Close on click outside or escape
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose]);

	// Adjust position to stay within viewport
	useEffect(() => {
		if (!menuRef.current) return;

		const menu = menuRef.current;
		const rect = menu.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		let adjustedX = x;
		let adjustedY = y;

		if (x + rect.width > viewportWidth) {
			adjustedX = viewportWidth - rect.width - 8;
		}
		if (y + rect.height > viewportHeight) {
			adjustedY = viewportHeight - rect.height - 8;
		}

		menu.style.left = `${adjustedX}px`;
		menu.style.top = `${adjustedY}px`;
	}, [x, y]);

	const handleItemClick = useCallback(
		(item: MenuItem) => {
			if (item.disabled || item.id === "divider") return;
			onAction(item.id);
		},
		[onAction],
	);

	return (
		<div
			ref={menuRef}
			className="fixed z-50 min-w-[160px] bg-popover border border-border rounded-md shadow-md py-1"
			style={{ left: x, top: y }}
		>
			{menuItems.map((item) =>
				item.id === "divider" ? (
					<div key="divider" className="my-1 h-px bg-border" />
				) : (
					<button
						key={item.id}
						type="button"
						className={cn(
							"w-full px-3 py-1.5 text-sm text-left",
							"hover:bg-accent hover:text-accent-foreground",
							"focus:bg-accent focus:text-accent-foreground focus:outline-none",
							item.disabled && "opacity-50 cursor-not-allowed",
						)}
						onClick={() => handleItemClick(item)}
						disabled={item.disabled}
					>
						{item.label}
					</button>
				),
			)}
		</div>
	);
}
