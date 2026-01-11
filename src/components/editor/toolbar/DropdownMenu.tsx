/**
 * Generic dropdown menu component
 *
 * Uses React Portal to render directly under body to avoid parent overflow clipping.
 */

import { ChevronDown } from "lucide-react";
import {
	createContext,
	type MouseEvent,
	type ReactNode,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

interface DropdownMenuContextValue {
	closeMenu: () => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(
	null,
);

interface DropdownMenuProps {
	label: ReactNode;
	title?: string;
	children: ReactNode;
	disabled?: boolean;
	className?: string;
}

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

	useLayoutEffect(() => {
		if (isOpen && buttonRef.current && menuRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect();
			const menuRect = menuRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;

			let left = buttonRect.left;

			if (left + menuRect.width > viewportWidth - 8) {
				left = viewportWidth - menuRect.width - 8;
			}

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

	useEffect(() => {
		if (!isOpen) {
			setIsPositioned(false);
		}
	}, [isOpen]);

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
					<DropdownMenuContext.Provider
						value={{ closeMenu: () => setIsOpen(false) }}
					>
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
						</div>
					</DropdownMenuContext.Provider>,
					document.body,
				)}
		</div>
	);
}

interface DropdownItemProps {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	title?: string;
	icon?: ReactNode;
}

export function DropdownItem({
	children,
	onClick,
	disabled = false,
	title,
	icon,
}: DropdownItemProps) {
	const context = useContext(DropdownMenuContext);

	const handleClick = () => {
		onClick?.();
		context?.closeMenu();
	};

	return (
		<button
			type="button"
			onClick={handleClick}
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
	label?: string;
}

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
