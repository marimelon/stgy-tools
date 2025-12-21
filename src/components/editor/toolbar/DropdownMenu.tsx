/**
 * 汎用ドロップダウンメニューコンポーネント
 *
 * ツールバーのボタンをクリックすると展開されるメニュー
 * React Portalを使用してbody直下にレンダリングし、親要素のoverflowの影響を受けない
 */

import {
	useState,
	useRef,
	useEffect,
	useLayoutEffect,
	type ReactNode,
	type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

interface DropdownMenuProps {
	/** トリガーボタンのラベル */
	label: ReactNode;
	/** ツールチップ */
	title?: string;
	/** メニューの内容 */
	children: ReactNode;
	/** 無効状態 */
	disabled?: boolean;
	/** 追加のCSSクラス */
	className?: string;
}

/**
 * ドロップダウンメニュー
 */
export function DropdownMenu({
	label,
	title,
	children,
	disabled = false,
	className = "",
}: DropdownMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isPositioned, setIsPositioned] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

	// メニュー位置を計算（画面端を超えないように調整）
	useLayoutEffect(() => {
		if (isOpen && buttonRef.current && menuRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect();
			const menuRect = menuRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;

			let left = buttonRect.left;

			// 右端を超える場合は左に調整
			if (left + menuRect.width > viewportWidth - 8) {
				left = viewportWidth - menuRect.width - 8;
			}

			// 左端を超えないように
			if (left < 8) {
				left = 8;
			}

			setMenuPosition({
				top: buttonRect.bottom + 4,
				left,
			});
			setIsPositioned(true);
		}
	}, [isOpen]);

	// 閉じた時にリセット
	useEffect(() => {
		if (!isOpen) {
			setIsPositioned(false);
		}
	}, [isOpen]);

	// クリック外で閉じる
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: globalThis.MouseEvent) => {
			const target = event.target as Node;
			if (
				buttonRef.current &&
				!buttonRef.current.contains(target) &&
				menuRef.current &&
				!menuRef.current.contains(target)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Escapeキーで閉じる
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const handleToggle = (e: MouseEvent) => {
		e.stopPropagation();
		if (!disabled) {
			setIsOpen(!isOpen);
		}
	};

	return (
		<div className={className}>
			<button
				ref={buttonRef}
				type="button"
				onClick={handleToggle}
				disabled={disabled}
				title={title}
				className={`px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
					isOpen ? "bg-slate-600" : ""
				}`}
			>
				{label}
				<ChevronDown size={14} className="ml-0.5" />
			</button>

			{isOpen &&
				createPortal(
					<div
						ref={menuRef}
						className="fixed bg-slate-800 border border-slate-600 rounded shadow-lg z-[9999] min-w-max"
						style={{
							top: menuPosition.top,
							left: menuPosition.left,
							visibility: isPositioned ? "visible" : "hidden",
						}}
					>
						{children}
					</div>,
					document.body,
				)}
		</div>
	);
}

interface DropdownItemProps {
	/** アイテムのラベル */
	children: ReactNode;
	/** クリック時のコールバック */
	onClick?: () => void;
	/** 無効状態 */
	disabled?: boolean;
	/** ツールチップ */
	title?: string;
	/** アイコン（左側） */
	icon?: ReactNode;
}

/**
 * ドロップダウンメニューアイテム
 */
export function DropdownItem({
	children,
	onClick,
	disabled = false,
	title,
	icon,
}: DropdownItemProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			className="w-full px-3 py-2 text-sm text-left text-slate-200 hover:bg-slate-700 disabled:text-slate-500 disabled:hover:bg-transparent flex items-center gap-2 whitespace-nowrap"
		>
			{icon && <span className="w-5 text-center">{icon}</span>}
			{children}
		</button>
	);
}

interface DropdownDividerProps {
	/** ラベル（オプション） */
	label?: string;
}

/**
 * ドロップダウンメニューの区切り線
 */
export function DropdownDivider({ label }: DropdownDividerProps) {
	if (label) {
		return (
			<div className="px-3 py-1 text-xs text-slate-400 bg-slate-750 border-t border-slate-600">
				{label}
			</div>
		);
	}
	return <div className="border-t border-slate-600 my-1" />;
}
