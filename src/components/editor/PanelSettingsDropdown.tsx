/**
 * パネル設定ドロップダウンコンポーネント
 *
 * パネルの表示/非表示、配置プリセットを設定
 */

import { useEffect, useRef, useState } from "react";
import {
	PANEL_NAMES,
	type PanelId,
	type PanelPreset,
	PRESET_NAMES,
	usePanelLayout,
} from "@/lib/panel";

/**
 * パネル設定ドロップダウン
 */
export function PanelSettingsDropdown() {
	const {
		config,
		togglePanelVisibility,
		updatePanelSlot,
		applyPreset,
		resetToDefault,
	} = usePanelLayout();
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// クリック外で閉じる
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const panelIds: PanelId[] = ["objectPalette", "layerPanel", "propertyPanel"];
	const presetIds: PanelPreset[] = [
		"default",
		"propertyLeft",
		"allLeft",
		"allRight",
	];

	return (
		<div ref={dropdownRef} className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors flex items-center gap-1"
				title="パネルレイアウト設定"
			>
				⊞ レイアウト
				<span className="text-xs">{isOpen ? "▲" : "▼"}</span>
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-600 rounded shadow-lg z-50">
					{/* パネル表示/非表示 */}
					<div className="p-2 border-b border-slate-700">
						<div className="text-xs text-slate-400 mb-2">パネル表示</div>
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
									{PANEL_NAMES[panelId]}
								</span>
								<span className="text-xs text-slate-500 ml-auto">
									{config.panels[panelId].slot === "left" ? "左" : "右"}
								</span>
							</label>
						))}
					</div>

					{/* パネル配置 */}
					<div className="p-2 border-b border-slate-700">
						<div className="text-xs text-slate-400 mb-2">パネル配置</div>
						{panelIds.map((panelId) => (
							<div key={panelId} className="flex items-center gap-2 py-1 px-1">
								<span className="text-sm text-slate-200 flex-1">
									{PANEL_NAMES[panelId]}
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
										左
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
										右
									</button>
								</div>
							</div>
						))}
					</div>

					{/* プリセット */}
					<div className="p-2">
						<div className="text-xs text-slate-400 mb-2">プリセット</div>
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
									{PRESET_NAMES[preset]}
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
							デフォルトに戻す
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
