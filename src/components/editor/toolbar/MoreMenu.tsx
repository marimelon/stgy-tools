/**
 * その他メニューコンポーネント
 *
 * 小画面で使用する統合メニュー
 */

import {
	MoreHorizontal,
	ArrowUpToLine,
	ArrowUp,
	ArrowDown,
	ArrowDownToLine,
	Group,
	Ungroup,
	AlignStartVertical,
	AlignCenterVertical,
	AlignEndVertical,
	AlignStartHorizontal,
	AlignCenterHorizontal,
	AlignEndHorizontal,
	AlignHorizontalSpaceAround,
	AlignVerticalSpaceAround,
} from "lucide-react";
import { GRID_SIZES, type GridSettings, type AlignmentType } from "@/lib/editor";
import { DropdownMenu, DropdownItem, DropdownDivider } from "./DropdownMenu";

/** アイコンサイズ */
const ICON_SIZE = 16;

interface MoreMenuProps {
	// レイヤー操作
	onMoveLayer: (direction: "front" | "forward" | "backward" | "back") => void;
	hasSingleSelection: boolean;

	// グループ操作
	onGroup: () => void;
	onUngroup: () => void;
	canGroup: boolean;
	hasSelectedGroup: boolean;

	// 整列操作
	onAlign: (type: AlignmentType) => void;
	canAlign: boolean;

	// グリッド設定
	gridSettings: GridSettings;
	onGridSettingsChange: (settings: Partial<GridSettings>) => void;
}

/**
 * その他メニュー（小画面用）
 */
export function MoreMenu({
	onMoveLayer,
	hasSingleSelection,
	onGroup,
	onUngroup,
	canGroup,
	hasSelectedGroup,
	onAlign,
	canAlign,
	gridSettings,
	onGridSettingsChange,
}: MoreMenuProps) {
	return (
		<DropdownMenu
			label={<MoreHorizontal size={ICON_SIZE} />}
			title="その他の操作"
		>
			{/* レイヤー操作 */}
			<DropdownDivider label="レイヤー" />
			<DropdownItem
				onClick={() => onMoveLayer("front")}
				disabled={!hasSingleSelection}
				icon={<ArrowUpToLine size={ICON_SIZE} />}
			>
				最前面へ
			</DropdownItem>
			<DropdownItem
				onClick={() => onMoveLayer("forward")}
				disabled={!hasSingleSelection}
				icon={<ArrowUp size={ICON_SIZE} />}
			>
				前面へ
			</DropdownItem>
			<DropdownItem
				onClick={() => onMoveLayer("backward")}
				disabled={!hasSingleSelection}
				icon={<ArrowDown size={ICON_SIZE} />}
			>
				背面へ
			</DropdownItem>
			<DropdownItem
				onClick={() => onMoveLayer("back")}
				disabled={!hasSingleSelection}
				icon={<ArrowDownToLine size={ICON_SIZE} />}
			>
				最背面へ
			</DropdownItem>

			{/* グループ操作 */}
			<DropdownDivider label="グループ" />
			<DropdownItem
				onClick={onGroup}
				disabled={!canGroup}
				icon={<Group size={ICON_SIZE} />}
			>
				グループ化
			</DropdownItem>
			<DropdownItem
				onClick={onUngroup}
				disabled={!hasSelectedGroup}
				icon={<Ungroup size={ICON_SIZE} />}
			>
				グループ解除
			</DropdownItem>

			{/* 整列操作 */}
			<DropdownDivider label="整列" />
			<div className="grid grid-cols-3 gap-1 p-2">
				<button
					type="button"
					onClick={() => onAlign("left")}
					disabled={!canAlign}
					title="左揃え"
					className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded flex items-center justify-center"
				>
					<AlignStartVertical size={ICON_SIZE} />
				</button>
				<button
					type="button"
					onClick={() => onAlign("center")}
					disabled={!canAlign}
					title="左右中央揃え"
					className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded flex items-center justify-center"
				>
					<AlignCenterVertical size={ICON_SIZE} />
				</button>
				<button
					type="button"
					onClick={() => onAlign("right")}
					disabled={!canAlign}
					title="右揃え"
					className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded flex items-center justify-center"
				>
					<AlignEndVertical size={ICON_SIZE} />
				</button>
				<button
					type="button"
					onClick={() => onAlign("top")}
					disabled={!canAlign}
					title="上揃え"
					className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded flex items-center justify-center"
				>
					<AlignStartHorizontal size={ICON_SIZE} />
				</button>
				<button
					type="button"
					onClick={() => onAlign("middle")}
					disabled={!canAlign}
					title="上下中央揃え"
					className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded flex items-center justify-center"
				>
					<AlignCenterHorizontal size={ICON_SIZE} />
				</button>
				<button
					type="button"
					onClick={() => onAlign("bottom")}
					disabled={!canAlign}
					title="下揃え"
					className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded flex items-center justify-center"
				>
					<AlignEndHorizontal size={ICON_SIZE} />
				</button>
			</div>
			<div className="grid grid-cols-2 gap-1 px-2 pb-2">
				<button
					type="button"
					onClick={() => onAlign("distribute-h")}
					disabled={!canAlign}
					title="水平方向に均等配置"
					className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded flex items-center justify-center"
				>
					<AlignHorizontalSpaceAround size={ICON_SIZE} />
				</button>
				<button
					type="button"
					onClick={() => onAlign("distribute-v")}
					disabled={!canAlign}
					title="垂直方向に均等配置"
					className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-200 rounded flex items-center justify-center"
				>
					<AlignVerticalSpaceAround size={ICON_SIZE} />
				</button>
			</div>

			{/* グリッド設定 */}
			<DropdownDivider label="グリッド" />
			<div className="p-2">
				<label className="flex items-center gap-2 cursor-pointer mb-2">
					<input
						type="checkbox"
						checked={gridSettings.enabled}
						onChange={(e) => onGridSettingsChange({ enabled: e.target.checked })}
						className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
					/>
					<span className="text-sm text-slate-200">スナップ</span>
				</label>

				<div className="flex items-center gap-2 mb-2">
					<select
						value={gridSettings.size}
						onChange={(e) =>
							onGridSettingsChange({ size: Number(e.target.value) })
						}
						disabled={!gridSettings.enabled}
						className="flex-1 px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-200 disabled:opacity-50 focus:outline-none focus:border-cyan-500"
					>
						{GRID_SIZES.map((size) => (
							<option key={size} value={size}>
								{size}px
							</option>
						))}
					</select>
				</div>

				<label
					className={`flex items-center gap-2 cursor-pointer ${
						gridSettings.enabled ? "" : "opacity-50"
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
					<span className="text-sm text-slate-200">表示</span>
				</label>
			</div>
		</DropdownMenu>
	);
}
