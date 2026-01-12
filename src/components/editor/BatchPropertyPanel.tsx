/**
 * Batch property panel for editing multiple selected objects
 */

import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { COLOR_CHANGEABLE_OBJECT_IDS } from "@/components/board/ObjectRenderer/constants";
import { hexToRgb, rgbToHex } from "@/lib/editor";
import {
	type BatchPropertyValues,
	computeBatchPropertyValues,
	getCommonFlipFlags,
	haveSameObjectId,
	isMixed,
} from "@/lib/editor/batchUtils";
import type { BatchUpdatePayload } from "@/lib/editor/types";
import { useDebugMode } from "@/lib/settings";
import type { BoardObject } from "@/lib/stgy";
import {
	DEFAULT_EDIT_PARAMS,
	DEFAULT_FLIP_FLAGS,
	EDIT_PARAMS,
	EditParamIds,
	OBJECT_EDIT_PARAMS,
	OBJECT_FLIP_FLAGS,
	ObjectNames,
} from "@/lib/stgy";
import { ColorPalette } from "./ColorPalette";
import {
	Checkbox,
	NumberInput,
	PropertySection,
	SliderInput,
} from "./FormInputs";

export interface BatchPropertyPanelProps {
	objects: BoardObject[];
	onUpdate: (updates: BatchUpdatePayload) => void;
	onCommitHistory: (description: string) => void;
}

function MixedIndicator() {
	const { t } = useTranslation();
	return (
		<span className="text-xs text-muted-foreground italic">
			{t("batchProperty.mixed", "Mixed values")}
		</span>
	);
}

export function BatchPropertyPanel({
	objects,
	onUpdate,
	onCommitHistory,
}: BatchPropertyPanelProps) {
	const { t } = useTranslation();
	const debugMode = useDebugMode();

	const batchValues = useMemo(
		() => computeBatchPropertyValues(objects),
		[objects],
	);

	const sameObjectId = useMemo(() => haveSameObjectId(objects), [objects]);
	const commonObjectId = sameObjectId ? objects[0].objectId : null;

	const flipFlags = useMemo(() => {
		return getCommonFlipFlags(objects, OBJECT_FLIP_FLAGS, DEFAULT_FLIP_FLAGS);
	}, [objects]);

	const allColorChangeable = useMemo(() => {
		return objects.every((obj) =>
			COLOR_CHANGEABLE_OBJECT_IDS.has(obj.objectId),
		);
	}, [objects]);

	const handleRotationChange = useCallback(
		(rotation: number) => onUpdate({ rotation }),
		[onUpdate],
	);

	const handleSizeChange = useCallback(
		(size: number) => onUpdate({ size }),
		[onUpdate],
	);

	const handleColorChange = useCallback(
		(hex: string) => {
			const { r, g, b } = hexToRgb(hex);
			onUpdate({ color: { r, g, b } });
		},
		[onUpdate],
	);

	const handleOpacityChange = useCallback(
		(opacity: number) => onUpdate({ color: { opacity } }),
		[onUpdate],
	);

	const handleVisibleChange = useCallback(
		(visible: boolean) => {
			onUpdate({ flags: { visible } });
			onCommitHistory(
				t("batchProperty.visibilityChanged", "Visibility changed"),
			);
		},
		[onUpdate, onCommitHistory, t],
	);

	const handleFlipHorizontalChange = useCallback(
		(flipHorizontal: boolean) => {
			onUpdate({ flags: { flipHorizontal } });
			onCommitHistory(t("batchProperty.flipChanged", "Flip changed"));
		},
		[onUpdate, onCommitHistory, t],
	);

	const handleFlipVerticalChange = useCallback(
		(flipVertical: boolean) => {
			onUpdate({ flags: { flipVertical } });
			onCommitHistory(t("batchProperty.flipChanged", "Flip changed"));
		},
		[onUpdate, onCommitHistory, t],
	);

	const handleLockedChange = useCallback(
		(locked: boolean) => {
			onUpdate({ flags: { locked } });
			onCommitHistory(t("batchProperty.lockChanged", "Lock changed"));
		},
		[onUpdate, onCommitHistory, t],
	);

	const displayColor = useMemo(() => {
		const r = isMixed(batchValues.color.r) ? 128 : batchValues.color.r;
		const g = isMixed(batchValues.color.g) ? 128 : batchValues.color.g;
		const b = isMixed(batchValues.color.b) ? 128 : batchValues.color.b;
		return rgbToHex(r, g, b);
	}, [batchValues.color]);

	const isColorMixed =
		isMixed(batchValues.color.r) ||
		isMixed(batchValues.color.g) ||
		isMixed(batchValues.color.b);

	return (
		<div className="h-full overflow-y-auto">
			<div className="p-4 space-y-1">
				<div className="mb-4">
					{sameObjectId && commonObjectId && (
						<span className="text-sm text-muted-foreground">
							{ObjectNames[commonObjectId]}
						</span>
					)}
				</div>

				<PropertySection title={t("batchProperty.transform", "Transform")}>
					<div className="space-y-3">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									{t("batchProperty.rotation", "Rotation")}
								</span>
								{isMixed(batchValues.rotation) && <MixedIndicator />}
							</div>
							<SliderInput
								label=""
								value={isMixed(batchValues.rotation) ? 0 : batchValues.rotation}
								min={-180}
								max={180}
								step={1}
								unit="°"
								onChange={handleRotationChange}
								onBlur={() =>
									onCommitHistory(
										t("batchProperty.rotationChanged", "Rotation changed"),
									)
								}
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									{t("batchProperty.size", "Size")}
								</span>
								{isMixed(batchValues.size) && <MixedIndicator />}
							</div>
							<SliderInput
								label=""
								value={isMixed(batchValues.size) ? 100 : batchValues.size}
								min={50}
								max={200}
								step={1}
								unit="%"
								onChange={handleSizeChange}
								onBlur={() =>
									onCommitHistory(
										t("batchProperty.sizeChanged", "Size changed"),
									)
								}
							/>
						</div>
					</div>
				</PropertySection>

				<PropertySection title={t("batchProperty.color", "Color")}>
					<div className="space-y-3">
						{debugMode && allColorChangeable && (
							<div className="flex items-center gap-3">
								<div className="relative rounded-md overflow-hidden border-2 border-border">
									<input
										type="color"
										value={displayColor}
										onChange={(e) => handleColorChange(e.target.value)}
										onBlur={() =>
											onCommitHistory(
												t("batchProperty.colorChanged", "Color changed"),
											)
										}
										className="w-10 h-8 cursor-pointer border-0 bg-transparent"
									/>
								</div>
								{isColorMixed && <MixedIndicator />}
							</div>
						)}
						{allColorChangeable && (
							<ColorPalette
								currentColor={
									isColorMixed
										? undefined
										: {
												r: batchValues.color.r as number,
												g: batchValues.color.g as number,
												b: batchValues.color.b as number,
											}
								}
								onColorSelect={(color) => {
									onUpdate({ color: { r: color.r, g: color.g, b: color.b } });
									onCommitHistory(
										t("batchProperty.colorChanged", "Color changed"),
									);
								}}
							/>
						)}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									{t("batchProperty.opacity", "Opacity")}
								</span>
								{isMixed(batchValues.color.opacity) && <MixedIndicator />}
							</div>
							<SliderInput
								label=""
								value={
									isMixed(batchValues.color.opacity)
										? 100
										: batchValues.color.opacity
								}
								min={0}
								max={100}
								step={1}
								unit="%"
								onChange={handleOpacityChange}
								onBlur={() =>
									onCommitHistory(
										t("batchProperty.opacityChanged", "Opacity changed"),
									)
								}
							/>
						</div>
					</div>
				</PropertySection>

				<PropertySection title={t("batchProperty.state", "State")}>
					<div className="space-y-2.5">
						<div className="flex items-center justify-between">
							<Checkbox
								label={t("batchProperty.visible", "Visible")}
								checked={
									isMixed(batchValues.flags.visible)
										? true
										: batchValues.flags.visible
								}
								onChange={handleVisibleChange}
							/>
							{isMixed(batchValues.flags.visible) && <MixedIndicator />}
						</div>
						{flipFlags.horizontal && (
							<div className="flex items-center justify-between">
								<Checkbox
									label={t("batchProperty.flipHorizontal", "Flip Horizontal")}
									checked={
										isMixed(batchValues.flags.flipHorizontal)
											? false
											: batchValues.flags.flipHorizontal
									}
									onChange={handleFlipHorizontalChange}
								/>
								{isMixed(batchValues.flags.flipHorizontal) && (
									<MixedIndicator />
								)}
							</div>
						)}
						{flipFlags.vertical && (
							<div className="flex items-center justify-between">
								<Checkbox
									label={t("batchProperty.flipVertical", "Flip Vertical")}
									checked={
										isMixed(batchValues.flags.flipVertical)
											? false
											: batchValues.flags.flipVertical
									}
									onChange={handleFlipVerticalChange}
								/>
								{isMixed(batchValues.flags.flipVertical) && <MixedIndicator />}
							</div>
						)}
						<div className="flex items-center justify-between">
							<Checkbox
								label={t("batchProperty.locked", "Locked")}
								checked={
									isMixed(batchValues.flags.locked)
										? false
										: batchValues.flags.locked
								}
								onChange={handleLockedChange}
							/>
							{isMixed(batchValues.flags.locked) && <MixedIndicator />}
						</div>
					</div>
				</PropertySection>

				{sameObjectId && commonObjectId && (
					<ObjectSpecificParams
						objectId={commonObjectId}
						batchValues={batchValues}
						onUpdate={onUpdate}
						onCommitHistory={onCommitHistory}
					/>
				)}
			</div>
		</div>
	);
}

function ObjectSpecificParams({
	objectId,
	batchValues,
	onUpdate,
	onCommitHistory,
}: {
	objectId: number;
	batchValues: BatchPropertyValues;
	onUpdate: (updates: BatchUpdatePayload) => void;
	onCommitHistory: (description: string) => void;
}) {
	const { t } = useTranslation();

	const editParams = OBJECT_EDIT_PARAMS[objectId] ?? DEFAULT_EDIT_PARAMS;

	const additionalParams = editParams.filter(
		(paramId) =>
			paramId !== EditParamIds.None &&
			paramId !== EditParamIds.Size &&
			paramId !== EditParamIds.SizeSmall &&
			paramId !== EditParamIds.Rotation &&
			paramId !== EditParamIds.Opacity,
	);

	if (additionalParams.length === 0) return null;

	return (
		<PropertySection
			title={t("batchProperty.specificParams", "Specific Parameters")}
		>
			<div className="space-y-3">
				{additionalParams.map((paramId) => {
					const paramDef = EDIT_PARAMS[paramId];
					if (!paramDef) return null;

					let paramKey: "param1" | "param2" | "param3";
					let value = batchValues.param1;

					if (
						paramId === EditParamIds.ConeAngle ||
						paramId === EditParamIds.DisplayCount ||
						paramId === EditParamIds.HeightCount ||
						paramId === EditParamIds.Height
					) {
						paramKey = "param1";
						value = batchValues.param1;
					} else if (
						paramId === EditParamIds.DonutRange ||
						paramId === EditParamIds.WidthCount ||
						paramId === EditParamIds.Width
					) {
						paramKey = "param2";
						value = batchValues.param2;
					} else if (paramId === EditParamIds.LineWidth) {
						paramKey = "param3";
						value = batchValues.param3;
					} else {
						return null;
					}

					const handleChange = (v: number) => onUpdate({ [paramKey]: v });

					const unit =
						paramId === EditParamIds.ConeAngle
							? "°"
							: paramId === EditParamIds.DonutRange
								? "%"
								: "";

					const isMixedValue = isMixed(value);
					const displayValue: number = isMixedValue
						? paramDef.defaultValue
						: ((value as number | undefined) ?? paramDef.defaultValue);

					return (
						<div key={paramId} className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									{paramDef.name}
								</span>
								{isMixedValue && <MixedIndicator />}
							</div>
							{paramDef.useSlider ? (
								<SliderInput
									label=""
									value={displayValue}
									min={paramDef.min}
									max={paramDef.max}
									step={1}
									unit={unit}
									onChange={handleChange}
									onBlur={() =>
										onCommitHistory(
											`${paramDef.name}${t("batchProperty.changed", " changed")}`,
										)
									}
								/>
							) : (
								<NumberInput
									label=""
									value={displayValue}
									min={paramDef.min}
									max={paramDef.max}
									step={1}
									onChange={handleChange}
									onBlur={() =>
										onCommitHistory(
											`${paramDef.name}${t("batchProperty.changed", " changed")}`,
										)
									}
								/>
							)}
						</div>
					);
				})}
			</div>
		</PropertySection>
	);
}
