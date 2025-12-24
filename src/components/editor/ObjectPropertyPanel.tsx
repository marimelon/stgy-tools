/**
 * オブジェクトプロパティパネルコンポーネント
 *
 * shadcn/ui ベースの選択オブジェクトプロパティ編集
 */

import { useTranslation } from "react-i18next";
import { COLOR_CHANGEABLE_OBJECT_IDS } from "@/components/board/ObjectRenderer/constants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { hexToRgb, rgbToHex, useDebugMode } from "@/lib/editor";
import type { BoardObject } from "@/lib/stgy";
import {
	DEFAULT_EDIT_PARAMS,
	DEFAULT_FLIP_FLAGS,
	EDIT_PARAMS,
	EditParamIds,
	OBJECT_EDIT_PARAMS,
	OBJECT_FLIP_FLAGS,
	ObjectIds,
} from "@/lib/stgy";
import { ColorPalette } from "./ColorPalette";
import {
	Checkbox,
	NumberInput,
	PropertySection,
	SliderInput,
} from "./FormInputs";

/** EditParamIds を i18n キーにマッピング */
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

/**
 * オブジェクトプロパティパネルのProps
 */
export interface ObjectPropertyPanelProps {
	/** 選択されたオブジェクト */
	object: BoardObject;
	/** オブジェクト更新時のコールバック */
	onUpdate: (updates: Partial<BoardObject>) => void;
	/** 履歴コミット時のコールバック */
	onCommitHistory: (description: string) => void;
}

/**
 * オブジェクトプロパティパネル
 */
export function ObjectPropertyPanel({
	object,
	onUpdate,
	onCommitHistory,
}: ObjectPropertyPanelProps) {
	const { t } = useTranslation();
	const { debugMode } = useDebugMode();

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

	// Lineの角度変更時に中央を軸として回転
	const handleLineRotationChange = (newRotation: number) => {
		const startX = object.position.x;
		const startY = object.position.y;
		const endX = (object.param1 ?? startX * 10 + 2560) / 10;
		const endY = (object.param2 ?? startY * 10) / 10;

		// 線分の中央点を計算
		const centerX = (startX + endX) / 2;
		const centerY = (startY + endY) / 2;

		// 中央から端点までの長さ（線分の長さの半分）
		const dx = endX - startX;
		const dy = endY - startY;
		const halfLength = Math.sqrt(dx * dx + dy * dy) / 2;

		// 新しい角度で中央から始点・終点を計算
		const radians = (newRotation * Math.PI) / 180;
		const offsetX = halfLength * Math.cos(radians);
		const offsetY = halfLength * Math.sin(radians);

		// 新しい始点（中央から逆方向）
		const newStartX = centerX - offsetX;
		const newStartY = centerY - offsetY;

		// 新しい終点（中央から正方向）
		const newEndX = centerX + offsetX;
		const newEndY = centerY + offsetY;

		handleChange({
			rotation: newRotation,
			position: { x: newStartX, y: newStartY },
			param1: Math.round(newEndX * 10),
			param2: Math.round(newEndY * 10),
		});
	};

	// 反転可能フラグを取得
	const flipFlags = OBJECT_FLIP_FLAGS[object.objectId] ?? DEFAULT_FLIP_FLAGS;
	const canFlipHorizontal = flipFlags.horizontal;
	const canFlipVertical = flipFlags.vertical;

	// 編集可能パラメータを取得
	const editParams = OBJECT_EDIT_PARAMS[object.objectId] ?? DEFAULT_EDIT_PARAMS;

	// 追加パラメータ（サイズ、回転、透過度以外）をフィルタリング
	const additionalParams = editParams.filter(
		(paramId) =>
			paramId !== EditParamIds.None &&
			paramId !== EditParamIds.Size &&
			paramId !== EditParamIds.SizeSmall &&
			paramId !== EditParamIds.Rotation &&
			paramId !== EditParamIds.Opacity,
	);

	return (
		<div className="panel h-full overflow-y-auto">
			<div className="panel-header">
				<h2 className="panel-title">
					{t("propertyPanel.title")}
					<span className="ml-2 text-xs font-normal text-accent">1</span>
				</h2>
			</div>

			<div className="p-4 space-y-1">
				{/* オブジェクト情報 */}
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

				{/* 位置 */}
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

				{/* 変形 */}
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
								// オブジェクトタイプに応じたサイズパラメータを取得
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

				{/* 色 */}
				<PropertySection title={t("propertyPanel.color")}>
					<div className="space-y-3">
						{/* カラーピッカー（デバッグモード時のみ・色変更可能オブジェクトのみ） */}
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
						{/* カラーパレット（色変更可能オブジェクトのみ） */}
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

				{/* フラグ */}
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

				{/* テキスト (テキストオブジェクトのみ) */}
				{isTextObject && (
					<PropertySection title={t("propertyPanel.text")}>
						<Input
							type="text"
							value={object.text ?? ""}
							onChange={(e) => handleChange({ text: e.target.value })}
							onBlur={(e) => {
								// 空文字の場合はデフォルトテキストに戻す
								if (e.target.value.trim() === "") {
									handleChange({ text: t("common.defaultText") });
								}
								onCommitHistory(t("propertyPanel.textChanged"));
							}}
						/>
					</PropertySection>
				)}

				{/* 固有パラメータ（動的生成） */}
				{additionalParams.length > 0 && (
					<PropertySection title={t("propertyPanel.specificParams")}>
						<div className="space-y-3">
							{additionalParams.map((paramId) => {
								const paramDef = EDIT_PARAMS[paramId];
								if (!paramDef) return null;

								// 各パラメータIDに対応するオブジェクトプロパティを決定
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
									// Lineの場合はparam3（線の太さ）、それ以外はparam1
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

								// 単位を決定
								const unit =
									paramId === EditParamIds.ConeAngle
										? "°"
										: paramId === EditParamIds.DonutRange
											? "%"
											: "";

								// i18nキーを取得
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
