/**
 * 円形配置モードプロパティパネル
 *
 * 円形配置モード時に表示されるプロパティパネル
 */

import { useTranslation } from "react-i18next";
import type { Position } from "@/lib/stgy";
import { NumberInput, PropertySection } from "./FormInputs";

interface CircularPropertyPanelProps {
	/** 円の中心 */
	center: Position;
	/** 円の半径 */
	radius: number;
	/** オブジェクト数 */
	objectCount: number;
	/** 中心変更時のコールバック */
	onCenterChange: (center: Position) => void;
	/** 半径変更時のコールバック */
	onRadiusChange: (radius: number) => void;
	/** 履歴コミット時のコールバック */
	onCommitHistory: (description: string) => void;
}

/**
 * 円形配置モードプロパティパネル
 */
export function CircularPropertyPanel({
	center,
	radius,
	objectCount,
	onCenterChange,
	onRadiusChange,
	onCommitHistory,
}: CircularPropertyPanelProps) {
	const { t } = useTranslation();

	return (
		<div className="h-full overflow-y-auto">
			<div className="p-4 space-y-1">
				{/* モード情報 */}
				<div className="mb-4">
					<div className="text-xs font-medium mb-1.5 uppercase tracking-wide text-muted-foreground font-display">
						{t("circularMode.title")}
					</div>
					<div className="text-sm text-muted-foreground">
						{t("circularMode.objectCount", { count: objectCount })}
					</div>
				</div>

				{/* 中心位置 */}
				<PropertySection title={t("circularMode.center")}>
					<div className="grid grid-cols-2 gap-3">
						<NumberInput
							label="X"
							value={Math.round(center.x)}
							min={0}
							max={512}
							step={1}
							onChange={(x) => onCenterChange({ x, y: center.y })}
							onBlur={() => onCommitHistory(t("circularMode.centerChanged"))}
						/>
						<NumberInput
							label="Y"
							value={Math.round(center.y)}
							min={0}
							max={384}
							step={1}
							onChange={(y) => onCenterChange({ x: center.x, y })}
							onBlur={() => onCommitHistory(t("circularMode.centerChanged"))}
						/>
					</div>
				</PropertySection>

				{/* 半径 */}
				<PropertySection title={t("circularMode.radius")}>
					<NumberInput
						label={t("circularMode.radiusLabel")}
						value={Math.round(radius)}
						min={10}
						max={300}
						step={1}
						onChange={onRadiusChange}
						onBlur={() => onCommitHistory(t("circularMode.radiusChanged"))}
					/>
				</PropertySection>
			</div>
		</div>
	);
}
