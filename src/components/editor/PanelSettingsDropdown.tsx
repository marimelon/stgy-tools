/**
 * パネル設定ドロップダウンコンポーネント
 *
 * パネルの表示/非表示、配置プリセットを設定
 * React Portalを使用してbody直下にレンダリングし、親要素のoverflowの影響を受けない
 */

import { ChevronDown, ChevronUp, LayoutPanelLeft } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { type PanelId, type PanelPreset, usePanelLayout } from "@/lib/panel";

/** アイコンサイズ */
const ICON_SIZE = 16;

/** メニュー幅 */
const MENU_WIDTH = 256;

/**
 * パネル設定ドロップダウン
 */
export function PanelSettingsDropdown() {
	const { t } = useTranslation();
	const {
		config,
		togglePanelVisibility,
		updatePanelSlot,
		applyPreset,
		resetToDefault,
	} = usePanelLayout();
	const [isOpen, setIsOpen] = useState(false);
	const [isPositioned, setIsPositioned] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

	// メニュー位置を計算（画面端を超えないように調整）
	useLayoutEffect(() => {
		if (isOpen && buttonRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;

			let left = buttonRect.left;

			// 右端を超える場合は左に調整
			if (left + MENU_WIDTH > viewportWidth - 8) {
				left = viewportWidth - MENU_WIDTH - 8;
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

		const handleClickOutside = (e: globalThis.MouseEvent) => {
			const target = e.target as Node;
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

	const panelIds: PanelId[] = [
		"objectPalette",
		"layerPanel",
		"propertyPanel",
		"historyPanel",
	];
	const presetIds: PanelPreset[] = [
		"default",
		"propertyLeft",
		"allLeft",
		"allRight",
	];

	return (
		<div>
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors flex items-center gap-1"
				title={t("panelSettings.title")}
			>
				<LayoutPanelLeft size={ICON_SIZE} />
				{isOpen ? (
					<ChevronUp size={14} className="ml-0.5" />
				) : (
					<ChevronDown size={14} className="ml-0.5" />
				)}
			</button>

			{isOpen &&
				createPortal(
					<div
						ref={menuRef}
						className="fixed bg-slate-800 border border-slate-600 rounded shadow-lg z-[9999]"
						style={{
							top: menuPosition.top,
							left: menuPosition.left,
							width: MENU_WIDTH,
							visibility: isPositioned ? "visible" : "hidden",
						}}
					>
						{/* パネル表示/非表示 */}
						<div className="p-2 border-b border-slate-700">
							<div className="text-xs text-slate-400 mb-2">
								{t("panelSettings.panelVisibility")}
							</div>
							{panelIds.map((panelId) => (
								<label
									key={panelId}
									className="flex items-center gap-2 py-1 px-1 hover:bg-slate-700 rounded cursor-pointer"
								>
									<input
										type="checkbox"
										checked={config.panels[panelId].visible}
										onChange={() => togglePanelVisibility(panelId)}
										className="w-3 h-3 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
									/>
									<span className="text-sm text-slate-200">
										{t(`panelSettings.${panelId}`)}
									</span>
									<span className="text-xs text-slate-500 ml-auto">
										{config.panels[panelId].slot === "left"
											? t("panelSettings.left")
											: t("panelSettings.right")}
									</span>
								</label>
							))}
						</div>

						{/* パネル配置 */}
						<div className="p-2 border-b border-slate-700">
							<div className="text-xs text-slate-400 mb-2">
								{t("panelSettings.panelPosition")}
							</div>
							{panelIds.map((panelId) => (
								<div
									key={panelId}
									className="flex items-center gap-2 py-1 px-1"
								>
									<span className="text-sm text-slate-200 flex-1">
										{t(`panelSettings.${panelId}`)}
									</span>
									<div className="flex gap-1">
										<button
											type="button"
											onClick={() => updatePanelSlot(panelId, "left")}
											className={`px-2 py-0.5 text-xs rounded transition-colors ${
												config.panels[panelId].slot === "left"
													? "bg-cyan-600 text-white"
													: "bg-slate-700 text-slate-300 hover:bg-slate-600"
											}`}
										>
											{t("panelSettings.left")}
										</button>
										<button
											type="button"
											onClick={() => updatePanelSlot(panelId, "right")}
											className={`px-2 py-0.5 text-xs rounded transition-colors ${
												config.panels[panelId].slot === "right"
													? "bg-cyan-600 text-white"
													: "bg-slate-700 text-slate-300 hover:bg-slate-600"
											}`}
										>
											{t("panelSettings.right")}
										</button>
									</div>
								</div>
							))}
						</div>

						{/* プリセット */}
						<div className="p-2">
							<div className="text-xs text-slate-400 mb-2">
								{t("panelSettings.presets")}
							</div>
							<div className="grid grid-cols-2 gap-1">
								{presetIds.map((preset) => (
									<button
										key={preset}
										type="button"
										onClick={() => {
											applyPreset(preset);
											setIsOpen(false);
										}}
										className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
									>
										{t(`panelSettings.${preset}`)}
									</button>
								))}
							</div>
							<button
								type="button"
								onClick={() => {
									resetToDefault();
									setIsOpen(false);
								}}
								className="w-full mt-2 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 rounded transition-colors"
							>
								{t("panelSettings.resetToDefault")}
							</button>
						</div>
					</div>,
					document.body,
				)}
		</div>
	);
}
