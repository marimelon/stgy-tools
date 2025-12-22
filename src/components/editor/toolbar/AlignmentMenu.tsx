/**
 * 整列メニューコンポーネント
 *
 * オブジェクトの整列・配置機能をドロップダウンで提供
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
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
	i18nKey: string;
	icon: ReactNode;
	group: "horizontal" | "vertical" | "distribute";
}[] = [
	{
		type: "left",
		i18nKey: "alignment.alignLeft",
		icon: <AlignStartVertical size={ICON_SIZE} />,
		group: "horizontal",
	},
	{
		type: "center",
		i18nKey: "alignment.alignCenterH",
		icon: <AlignCenterVertical size={ICON_SIZE} />,
		group: "horizontal",
	},
	{
		type: "right",
		i18nKey: "alignment.alignRight",
		icon: <AlignEndVertical size={ICON_SIZE} />,
		group: "horizontal",
	},
	{
		type: "top",
		i18nKey: "alignment.alignTop",
		icon: <AlignStartHorizontal size={ICON_SIZE} />,
		group: "vertical",
	},
	{
		type: "middle",
		i18nKey: "alignment.alignCenterV",
		icon: <AlignCenterHorizontal size={ICON_SIZE} />,
		group: "vertical",
	},
	{
		type: "bottom",
		i18nKey: "alignment.alignBottom",
		icon: <AlignEndHorizontal size={ICON_SIZE} />,
		group: "vertical",
	},
	{
		type: "distribute-h",
		i18nKey: "alignment.distributeH",
		icon: <AlignHorizontalSpaceAround size={ICON_SIZE} />,
		group: "distribute",
	},
	{
		type: "distribute-v",
		i18nKey: "alignment.distributeV",
		icon: <AlignVerticalSpaceAround size={ICON_SIZE} />,
		group: "distribute",
	},
];

/**
 * 整列メニュー
 */
export function AlignmentMenu({ onAlign, canAlign }: AlignmentMenuProps) {
	const { t } = useTranslation();
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
			title={t("alignment.title")}
			disabled={!canAlign}
		>
			<DropdownDivider label={t("alignment.horizontal")} />
			{horizontalOptions.map((opt) => (
				<DropdownItem
					key={opt.type}
					onClick={() => onAlign(opt.type)}
					icon={opt.icon}
				>
					{t(opt.i18nKey)}
				</DropdownItem>
			))}

			<DropdownDivider label={t("alignment.vertical")} />
			{verticalOptions.map((opt) => (
				<DropdownItem
					key={opt.type}
					onClick={() => onAlign(opt.type)}
					icon={opt.icon}
				>
					{t(opt.i18nKey)}
				</DropdownItem>
			))}

			<DropdownDivider label={t("alignment.distribute")} />
			{distributeOptions.map((opt) => (
				<DropdownItem
					key={opt.type}
					onClick={() => onAlign(opt.type)}
					icon={opt.icon}
				>
					{t(opt.i18nKey)}
				</DropdownItem>
			))}
		</DropdownMenu>
	);
}
