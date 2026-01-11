/**
 * Object property panel component (shadcn/ui based)
 */

import { useTranslation } from "react-i18next";
import { COLOR_CHANGEABLE_OBJECT_IDS } from "@/components/board/ObjectRenderer/constants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { hexToRgb, rgbToHex } from "@/lib/editor";
import { useDebugMode } from "@/lib/settings";
import type { BoardObject } from "@/lib/stgy";
import {
	DEFAULT_EDIT_PARAMS,
	DEFAULT_FLIP_FLAGS,
	EDIT_PARAMS,
	EditParamIds,
	getUtf8ByteLength,
	MAX_TEXT_BYTES,
	OBJECT_EDIT_PARAMS,
	OBJECT_FLIP_FLAGS,
	ObjectIds,
	truncateToUtf8Bytes,
} from "@/lib/stgy";
import { ColorPalette } from "./ColorPalette";
import {
	Checkbox,
	NumberInput,
	PropertySection,
	SliderInput,
} from "./FormInputs";

const EDIT_PARAM_I18N_KEYS: Record<number, string> = {
	[EditParamIds.Size]: "editParam.size",
	[EditParamIds.Rotation]: "editParam.angle",
	[EditParamIds.Opacity]: "editParam.opacity",
	[EditParamIds.Height]: "editParam.height",
	[EditParamIds.Width]: "editParam.width",
	[EditParamIds.ConeAngle]: "editParam.coneAngle",
	[EditParamIds.DonutRange]: "editParam.donutRange",
	[EditParamIds.DisplayCount]: "editParam.displayCount",
	[EditParamIds.HeightCount]: "editParam.heightCount",
	[EditParamIds.WidthCount]: "editParam.widthCount",
	[EditParamIds.LineWidth]: "editParam.lineWidth",
	[EditParamIds.SizeSmall]: "editParam.size",
};

export interface ObjectPropertyPanelProps {
	object: BoardObject;
	onUpdate: (updates: Partial<BoardObject>) => void;
	onCommitHistory: (description: string) => void;
}
export function ObjectPropertyPanel({
	object,
	onUpdate,
	onCommitHistory,
}: ObjectPropertyPanelProps) {
	const { t } = useTranslation();
	const debugMode = useDebugMode();

	const handleChange = (updates: Partial<BoardObject>) => {
		onUpdate(updates);
	};

	const handleChangeAndCommit = (
		updates: Partial<BoardObject>,
		description: string,
	) => {
		onUpdate(updates);
		onCommitHistory(description);
	};

	const objectName = t(`object.${object.objectId}`, {
		defaultValue: t("propertyPanel.unknown"),
	});
	const isTextObject = object.objectId === ObjectIds.Text;
	const isLineObject = object.objectId === ObjectIds.Line;
	const isColorChangeable = COLOR_CHANGEABLE_OBJECT_IDS.has(object.objectId);

	// Rotate Line around center when angle changes
	const handleLineRotationChange = (newRotation: number) => {
		const startX = object.position.x;
		const startY = object.position.y;
		const endX = (object.param1 ?? startX * 10 + 2560) / 10;
		const endY = (object.param2 ?? startY * 10) / 10;

		const centerX = (startX + endX) / 2;
		const centerY = (startY + endY) / 2;

		const dx = endX - startX;
		const dy = endY - startY;
		const halfLength = Math.sqrt(dx * dx + dy * dy) / 2;

		const radians = (newRotation * Math.PI) / 180;
		const offsetX = halfLength * Math.cos(radians);
		const offsetY = halfLength * Math.sin(radians);

		const newStartX = centerX - offsetX;
		const newStartY = centerY - offsetY;

		const newEndX = centerX + offsetX;
		const newEndY = centerY + offsetY;

		handleChange({
			rotation: newRotation,
			position: { x: newStartX, y: newStartY },
			param1: Math.round(newEndX * 10),
			param2: Math.round(newEndY * 10),
		});
	};

	const flipFlags = OBJECT_FLIP_FLAGS[object.objectId] ?? DEFAULT_FLIP_FLAGS;
	const canFlipHorizontal = flipFlags.horizontal;
	const canFlipVertical = flipFlags.vertical;

	const editParams = OBJECT_EDIT_PARAMS[object.objectId] ?? DEFAULT_EDIT_PARAMS;

	// Filter out standard params (size, rotation, opacity)
	const additionalParams = editParams.filter(
		(paramId) =>
			paramId !== EditParamIds.None &&
			paramId !== EditParamIds.Size &&
			paramId !== EditParamIds.SizeSmall &&
			paramId !== EditParamIds.Rotation &&
			paramId !== EditParamIds.Opacity,
	);

	return (
		<div className="h-full overflow-y-auto">
			<div className="p-4 space-y-1">
				<div className="mb-4">
					<div className="text-xs font-medium mb-1.5 uppercase tracking-wide text-muted-foreground font-display">
						{t("propertyPanel.object")}
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">{objectName}</span>
						<Badge variant="secondary" className="font-mono text-xs">
							ID: {object.objectId}
						</Badge>
					</div>
				</div>

				<PropertySection title={t("propertyPanel.position")}>
					<div className="grid grid-cols-2 gap-3">
						<NumberInput
							label="X"
							value={object.position.x}
							min={0}
							max={512}
							step={1}
							onChange={(x) =>
								handleChange({ position: { ...object.position, x } })
							}
							onBlur={() => onCommitHistory(t("propertyPanel.positionChanged"))}
						/>
						<NumberInput
							label="Y"
							value={object.position.y}
							min={0}
							max={384}
							step={1}
							onChange={(y) =>
								handleChange({ position: { ...object.position, y } })
							}
							onBlur={() => onCommitHistory(t("propertyPanel.positionChanged"))}
						/>
					</div>
				</PropertySection>

				<PropertySection title={t("propertyPanel.transform")}>
					<div className="space-y-3">
						<SliderInput
							label={t("propertyPanel.rotation")}
							value={object.rotation}
							min={-180}
							max={180}
							step={1}
							unit="°"
							onChange={
								isLineObject
									? handleLineRotationChange
									: (rotation) => handleChange({ rotation })
							}
							onBlur={() => onCommitHistory(t("propertyPanel.rotationChanged"))}
						/>
						{!isLineObject &&
							(() => {
								const editParams =
									OBJECT_EDIT_PARAMS[object.objectId] ?? DEFAULT_EDIT_PARAMS;
								const sizeParamId = editParams.includes(EditParamIds.SizeSmall)
									? EditParamIds.SizeSmall
									: EditParamIds.Size;
								const sizeParam = EDIT_PARAMS[sizeParamId];
								return (
									<SliderInput
										label={t("propertyPanel.size")}
										value={object.size}
										min={sizeParam.min}
										max={sizeParam.max}
										step={1}
										unit="%"
										onChange={(size) => handleChange({ size })}
										onBlur={() =>
											onCommitHistory(t("propertyPanel.sizeChanged"))
										}
									/>
								);
							})()}
					</div>
				</PropertySection>

				<PropertySection title={t("propertyPanel.color")}>
					<div className="space-y-3">
						{/* Color picker (debug mode only, color-changeable objects only) */}
						{debugMode && isColorChangeable && (
							<div className="flex items-center gap-3">
								<div className="relative rounded-md overflow-hidden border-2 border-border">
									<input
										type="color"
										value={rgbToHex(
											object.color.r,
											object.color.g,
											object.color.b,
										)}
										onChange={(e) => {
											const { r, g, b } = hexToRgb(e.target.value);
											handleChange({ color: { ...object.color, r, g, b } });
										}}
										onBlur={() =>
											onCommitHistory(t("propertyPanel.colorChanged"))
										}
										className="w-10 h-8 cursor-pointer border-0 bg-transparent"
									/>
								</div>
								<span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-mono">
									RGB({object.color.r}, {object.color.g}, {object.color.b})
								</span>
							</div>
						)}
						{isColorChangeable && (
							<ColorPalette
								currentColor={object.color}
								onColorSelect={(color) => {
									handleChange({ color: { ...object.color, ...color } });
									onCommitHistory(t("propertyPanel.colorChanged"));
								}}
							/>
						)}
						<SliderInput
							label={t("propertyPanel.opacity")}
							value={object.color.opacity}
							min={0}
							max={100}
							step={1}
							unit="%"
							onChange={(opacity) =>
								handleChange({ color: { ...object.color, opacity } })
							}
							onBlur={() => onCommitHistory(t("propertyPanel.opacityChanged"))}
						/>
					</div>
				</PropertySection>

				<PropertySection title={t("propertyPanel.state")}>
					<div className="space-y-2.5">
						<Checkbox
							label={t("propertyPanel.visible")}
							checked={object.flags.visible}
							onChange={(visible) =>
								handleChangeAndCommit(
									{ flags: { ...object.flags, visible } },
									t("propertyPanel.visibilityChanged"),
								)
							}
						/>
						{canFlipHorizontal && (
							<Checkbox
								label={t("propertyPanel.flipHorizontal")}
								checked={object.flags.flipHorizontal}
								onChange={(flipHorizontal) =>
									handleChangeAndCommit(
										{ flags: { ...object.flags, flipHorizontal } },
										t("propertyPanel.flipChanged"),
									)
								}
							/>
						)}
						{canFlipVertical && (
							<Checkbox
								label={t("propertyPanel.flipVertical")}
								checked={object.flags.flipVertical}
								onChange={(flipVertical) =>
									handleChangeAndCommit(
										{ flags: { ...object.flags, flipVertical } },
										t("propertyPanel.flipChanged"),
									)
								}
							/>
						)}
						<Checkbox
							label={t("propertyPanel.locked")}
							checked={object.flags.locked}
							onChange={(locked) =>
								handleChangeAndCommit(
									{ flags: { ...object.flags, locked } },
									t("propertyPanel.lockChanged"),
								)
							}
						/>
					</div>
				</PropertySection>

				{isTextObject && (
					<PropertySection title={t("propertyPanel.text")}>
						<Input
							type="text"
							value={object.text ?? ""}
							onChange={(e) => {
								let newText = e.target.value;
								// Limit to 30 bytes unless in debug mode
								if (!debugMode) {
									newText = truncateToUtf8Bytes(newText, MAX_TEXT_BYTES);
								}
								handleChange({ text: newText });
							}}
							onBlur={(e) => {
								// Reset to default text if empty
								if (e.target.value.trim() === "") {
									handleChange({ text: t("common.defaultText") });
								}
								onCommitHistory(t("propertyPanel.textChanged"));
							}}
						/>
						{debugMode && (
							<div className="text-xs text-muted-foreground mt-1">
								{getUtf8ByteLength(object.text ?? "")} / {MAX_TEXT_BYTES} bytes
							</div>
						)}
					</PropertySection>
				)}

				{additionalParams.length > 0 && (
					<PropertySection title={t("propertyPanel.specificParams")}>
						<div className="space-y-3">
							{additionalParams.map((paramId) => {
								const paramDef = EDIT_PARAMS[paramId];
								if (!paramDef) return null;

								let value: number;
								let onChange: (v: number) => void;

								if (paramId === EditParamIds.ConeAngle) {
									value = object.param1 ?? paramDef.defaultValue;
									onChange = (v) => handleChange({ param1: v });
								} else if (paramId === EditParamIds.DonutRange) {
									value = object.param2 ?? paramDef.defaultValue;
									onChange = (v) => handleChange({ param2: v });
								} else if (paramId === EditParamIds.DisplayCount) {
									value = object.param1 ?? paramDef.defaultValue;
									onChange = (v) => handleChange({ param1: v });
								} else if (paramId === EditParamIds.HeightCount) {
									value = object.param1 ?? paramDef.defaultValue;
									onChange = (v) => handleChange({ param1: v });
								} else if (paramId === EditParamIds.WidthCount) {
									value = object.param2 ?? paramDef.defaultValue;
									onChange = (v) => handleChange({ param2: v });
								} else if (paramId === EditParamIds.LineWidth) {
									if (isLineObject) {
										value = object.param3 ?? paramDef.defaultValue;
										onChange = (v) => handleChange({ param3: v });
									} else {
										value = object.param1 ?? paramDef.defaultValue;
										onChange = (v) => handleChange({ param1: v });
									}
								} else if (paramId === EditParamIds.Height) {
									value = object.param1 ?? paramDef.defaultValue;
									onChange = (v) => handleChange({ param1: v });
								} else if (paramId === EditParamIds.Width) {
									value = object.param2 ?? paramDef.defaultValue;
									onChange = (v) => handleChange({ param2: v });
								} else {
									return null;
								}

								const unit =
									paramId === EditParamIds.ConeAngle
										? "°"
										: paramId === EditParamIds.DonutRange
											? "%"
											: "";

								const labelKey = EDIT_PARAM_I18N_KEYS[paramId];
								const label = labelKey ? t(labelKey) : paramDef.name;

								return paramDef.useSlider ? (
									<SliderInput
										key={paramId}
										label={label}
										value={value}
										min={paramDef.min}
										max={paramDef.max}
										step={1}
										unit={unit}
										onChange={onChange}
										onBlur={() =>
											onCommitHistory(`${label}${t("batchProperty.changed")}`)
										}
									/>
								) : (
									<NumberInput
										key={paramId}
										label={label}
										value={value}
										min={paramDef.min}
										max={paramDef.max}
										step={1}
										onChange={onChange}
										onBlur={() =>
											onCommitHistory(`${label}${t("batchProperty.changed")}`)
										}
									/>
								);
							})}
						</div>
					</PropertySection>
				)}
			</div>
		</div>
	);
}
