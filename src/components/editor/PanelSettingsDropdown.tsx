/**
 * パネル設定ドロップダウンコンポーネント
 *
 * パネルの表示/非表示、配置を設定
 * React Portalを使用してbody直下にレンダリングし、親要素のoverflowの影響を受けない
 */

import {
	ChevronDown as ArrowDown,
	ChevronUp as ArrowUp,
	ChevronDown,
	ChevronUp,
	LayoutPanelLeft,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
	type PanelConfig,
	type PanelId,
	type PanelSlot,
	usePanelLayout,
} from "@/lib/panel";

/** アイコンサイズ */
const ICON_SIZE = 16;

/** メニュー幅 */
const MENU_WIDTH = 320;

/**
 * パネル設定ドロップダウン
 */
export function PanelSettingsDropdown() {
	const { t } = useTranslation();
	const {
		config,
		togglePanelVisibility,
		updatePanelSlot,
		resetToDefault,
		reorderPanel,
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

	// クリック外で閉じる（キャプチャフェーズで捕捉してエディタ上のクリックも検知）
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent | PointerEvent) => {
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

		// キャプチャフェーズで捕捉することで、stopPropagationされる前にイベントを検知
		// SVGキャンバスはpointerdownを使用しているため、両方を監視
		document.addEventListener("mousedown", handleClickOutside, true);
		document.addEventListener("pointerdown", handleClickOutside, true);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside, true);
			document.removeEventListener("pointerdown", handleClickOutside, true);
		};
	}, [isOpen]);

	const panelIds: PanelId[] = [
		"objectPalette",
		"assetPanel",
		"layerPanel",
		"propertyPanel",
		"historyPanel",
	];

	// スロット内の表示中パネルをソート順で取得（メモ化）
	const getVisiblePanelsInSlot = useCallback(
		(slot: PanelSlot) => {
			return (Object.entries(config.panels) as [PanelId, PanelConfig][])
				.filter(([_, cfg]) => cfg.slot === slot && cfg.visible)
				.sort(([_, a], [__, b]) => a.order - b.order)
				.map(([id, _]) => id);
		},
		[config.panels],
	);

	// 左右スロットの表示パネルをメモ化
	const leftVisiblePanels = useMemo(
		() => getVisiblePanelsInSlot("left"),
		[getVisiblePanelsInSlot],
	);

	const rightVisiblePanels = useMemo(
		() => getVisiblePanelsInSlot("right"),
		[getVisiblePanelsInSlot],
	);

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
						{/* パネル一覧（表示/配置統合） */}
						<div className="p-2 border-b border-slate-700">
							{panelIds.map((panelId) => {
								const isVisible = config.panels[panelId].visible;
								const slot = config.panels[panelId].slot;
								const visiblePanels =
									slot === "left" ? leftVisiblePanels : rightVisiblePanels;
								const index = visiblePanels.indexOf(panelId);
								const canGoUp = isVisible && index > 0;
								const canGoDown =
									isVisible && index !== -1 && index < visiblePanels.length - 1;

								return (
									<div
										key={panelId}
										className="flex items-center gap-2 py-1.5 px-1 hover:bg-slate-700/50 rounded"
									>
										<label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
											<input
												type="checkbox"
												checked={isVisible}
												onChange={() => togglePanelVisibility(panelId)}
												className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 flex-shrink-0"
											/>
											<span className="text-sm text-slate-200 whitespace-nowrap overflow-hidden text-ellipsis">
												{t(`panelSettings.${panelId}`)}
											</span>
										</label>

										{/* 順序変更ボタン（表示中のパネルのみ） */}
										{isVisible && (
											<div className="flex gap-0.5">
												<button
													type="button"
													onClick={() => reorderPanel(panelId, "up")}
													disabled={!canGoUp}
													title={t("panelSettings.moveUp")}
													aria-label={`${t(`panelSettings.${panelId}`)} ${t("panelSettings.moveUp")}`}
													className={`p-1 rounded transition-colors ${
														canGoUp
															? "text-slate-400 hover:bg-slate-600 hover:text-slate-200"
															: "text-slate-600 cursor-not-allowed"
													}`}
												>
													<ArrowUp size={14} />
												</button>
												<button
													type="button"
													onClick={() => reorderPanel(panelId, "down")}
													disabled={!canGoDown}
													title={t("panelSettings.moveDown")}
													aria-label={`${t(`panelSettings.${panelId}`)} ${t("panelSettings.moveDown")}`}
													className={`p-1 rounded transition-colors ${
														canGoDown
															? "text-slate-400 hover:bg-slate-600 hover:text-slate-200"
															: "text-slate-600 cursor-not-allowed"
													}`}
												>
													<ArrowDown size={14} />
												</button>
											</div>
										)}

										<div className="flex gap-0.5">
											<button
												type="button"
												onClick={() => updatePanelSlot(panelId, "left")}
												className={`px-2 py-0.5 text-xs rounded-l transition-colors ${
													config.panels[panelId].slot === "left"
														? "bg-cyan-600 text-white"
														: "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
												}`}
											>
												{t("panelSettings.left")}
											</button>
											<button
												type="button"
												onClick={() => updatePanelSlot(panelId, "right")}
												className={`px-2 py-0.5 text-xs rounded-r transition-colors ${
													config.panels[panelId].slot === "right"
														? "bg-cyan-600 text-white"
														: "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
												}`}
											>
												{t("panelSettings.right")}
											</button>
										</div>
									</div>
								);
							})}
						</div>

						{/* リセット */}
						<div className="p-2">
							<button
								type="button"
								onClick={() => {
									resetToDefault();
									setIsOpen(false);
								}}
								className="w-full px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 rounded transition-colors"
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
