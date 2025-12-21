/**
 * 整列メニューコンポーネント
 *
 * オブジェクトの整列・配置機能をドロップダウンで提供
 */

import type { ReactNode } from "react";
import {
	AlignStartVertical,
	AlignCenterVertical,
	AlignEndVertical,
	AlignStartHorizontal,
	AlignCenterHorizontal,
	AlignEndHorizontal,
	AlignHorizontalSpaceAround,
	AlignVerticalSpaceAround,
	AlignLeft,
} from "lucide-react";
import type { AlignmentType } from "@/lib/editor";
import { DropdownMenu, DropdownItem, DropdownDivider } from "./DropdownMenu";

/** アイコンサイズ */
const ICON_SIZE = 16;

interface AlignmentMenuProps {
	/** 整列実行コールバック */
	onAlign: (type: AlignmentType) => void;
	/** 整列可能かどうか */
	canAlign: boolean;
}

/** 整列オプションの定義 */
const ALIGNMENT_OPTIONS: {
	type: AlignmentType;
	label: string;
	icon: ReactNode;
	group: "horizontal" | "vertical" | "distribute";
}[] = [
	{
		type: "left",
		label: "左揃え",
		icon: <AlignStartVertical size={ICON_SIZE} />,
		group: "horizontal",
	},
	{
		type: "center",
		label: "左右中央揃え",
		icon: <AlignCenterVertical size={ICON_SIZE} />,
		group: "horizontal",
	},
	{
		type: "right",
		label: "右揃え",
		icon: <AlignEndVertical size={ICON_SIZE} />,
		group: "horizontal",
	},
	{
		type: "top",
		label: "上揃え",
		icon: <AlignStartHorizontal size={ICON_SIZE} />,
		group: "vertical",
	},
	{
		type: "middle",
		label: "上下中央揃え",
		icon: <AlignCenterHorizontal size={ICON_SIZE} />,
		group: "vertical",
	},
	{
		type: "bottom",
		label: "下揃え",
		icon: <AlignEndHorizontal size={ICON_SIZE} />,
		group: "vertical",
	},
	{
		type: "distribute-h",
		label: "水平方向に均等配置",
		icon: <AlignHorizontalSpaceAround size={ICON_SIZE} />,
		group: "distribute",
	},
	{
		type: "distribute-v",
		label: "垂直方向に均等配置",
		icon: <AlignVerticalSpaceAround size={ICON_SIZE} />,
		group: "distribute",
	},
];

/**
 * 整列メニュー
 */
export function AlignmentMenu({ onAlign, canAlign }: AlignmentMenuProps) {
	const horizontalOptions = ALIGNMENT_OPTIONS.filter(
		(opt) => opt.group === "horizontal",
	);
	const verticalOptions = ALIGNMENT_OPTIONS.filter(
		(opt) => opt.group === "vertical",
	);
	const distributeOptions = ALIGNMENT_OPTIONS.filter(
		(opt) => opt.group === "distribute",
	);

	return (
		<DropdownMenu
			label={<AlignLeft size={ICON_SIZE} />}
			title="整列・配置"
			disabled={!canAlign}
		>
			<DropdownDivider label="水平方向" />
			{horizontalOptions.map((opt) => (
				<DropdownItem
					key={opt.type}
					onClick={() => onAlign(opt.type)}
					icon={opt.icon}
				>
					{opt.label}
				</DropdownItem>
			))}

			<DropdownDivider label="垂直方向" />
			{verticalOptions.map((opt) => (
				<DropdownItem
					key={opt.type}
					onClick={() => onAlign(opt.type)}
					icon={opt.icon}
				>
					{opt.label}
				</DropdownItem>
			))}

			<DropdownDivider label="均等配置" />
			{distributeOptions.map((opt) => (
				<DropdownItem
					key={opt.type}
					onClick={() => onAlign(opt.type)}
					icon={opt.icon}
				>
					{opt.label}
				</DropdownItem>
			))}
		</DropdownMenu>
	);
}
