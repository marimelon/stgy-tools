/**
 * Circular placement mode property panel
 */

import { useTranslation } from "react-i18next";
import type { Position } from "@/lib/stgy";
import { NumberInput, PropertySection } from "./FormInputs";

interface CircularPropertyPanelProps {
	center: Position;
	radius: number;
	objectCount: number;
	onCenterChange: (center: Position) => void;
	onRadiusChange: (radius: number) => void;
	onCommitHistory: (description: string) => void;
}
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
				<div className="mb-4">
					<div className="text-xs font-medium mb-1.5 uppercase tracking-wide text-muted-foreground font-display">
						{t("circularMode.title")}
					</div>
					<div className="text-sm text-muted-foreground">
						{t("circularMode.objectCount", { count: objectCount })}
					</div>
				</div>

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
