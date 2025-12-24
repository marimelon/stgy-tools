/**
 * グリッド設定メニューコンポーネント
 *
 * グリッドスナップと表示設定をドロップダウンで提供
 */

import { Grid3x3 } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { GRID_SIZES, type GridSettings } from "@/lib/editor";
import { DropdownDivider, DropdownMenu } from "./DropdownMenu";

/** アイコンサイズ */
const ICON_SIZE = 16;

interface GridSettingsMenuProps {
	/** 現在のグリッド設定 */
	gridSettings: GridSettings;
	/** グリッド設定変更コールバック */
	onGridSettingsChange: (settings: Partial<GridSettings>) => void;
}

/**
 * グリッド設定メニュー
 */
export function GridSettingsMenu({
	gridSettings,
	onGridSettingsChange,
}: GridSettingsMenuProps) {
	const { t } = useTranslation();
	const gridSizeId = useId();
	return (
		<DropdownMenu
			label={
				<span className="flex items-center gap-1">
					<Grid3x3 size={ICON_SIZE} />
					{gridSettings.enabled && (
						<span className="w-2 h-2 bg-cyan-500 rounded-full" />
					)}
				</span>
			}
			title={t("toolbar.gridSettings")}
		>
			<div className="p-3 min-w-48">
				{/* グリッドスナップ有効/無効 */}
				<label className="flex items-center gap-2 cursor-pointer mb-3">
					<input
						type="checkbox"
						checked={gridSettings.enabled}
						onChange={(e) =>
							onGridSettingsChange({ enabled: e.target.checked })
						}
						className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
					/>
					<span className="text-sm text-slate-200">
						{t("moreMenu.gridSnap")}
					</span>
				</label>

				<DropdownDivider />

				{/* グリッドサイズ */}
				<div className="mt-3 mb-3">
					<label
						htmlFor={gridSizeId}
						className="block text-xs text-slate-400 mb-1"
					>
						{t("toolbar.gridSize")}
					</label>
					<select
						id={gridSizeId}
						value={gridSettings.size}
						onChange={(e) =>
							onGridSettingsChange({ size: Number(e.target.value) })
						}
						disabled={!gridSettings.enabled}
						className="w-full px-2 py-1.5 text-sm bg-slate-700 border border-slate-600 rounded text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-cyan-500"
					>
						{GRID_SIZES.map((size) => (
							<option key={size} value={size}>
								{size}px
							</option>
						))}
					</select>
				</div>

				<DropdownDivider />

				{/* グリッド表示 */}
				<label
					className={`flex items-center gap-2 mt-3 cursor-pointer ${
						gridSettings.enabled ? "" : "opacity-50 cursor-not-allowed"
					}`}
				>
					<input
						type="checkbox"
						checked={gridSettings.showGrid}
						onChange={(e) =>
							onGridSettingsChange({ showGrid: e.target.checked })
						}
						disabled={!gridSettings.enabled}
						className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
					/>
					<span className="text-sm text-slate-200">
						{t("moreMenu.showGrid")}
					</span>
				</label>
			</div>
		</DropdownMenu>
	);
}
