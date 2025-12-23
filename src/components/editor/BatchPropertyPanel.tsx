/**
 * バッチプロパティパネルコンポーネント
 *
 * 複数オブジェクト選択時の一括プロパティ編集
 */

import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { rgbToHex, hexToRgb, useDebugMode } from "@/lib/editor";
import {
	OBJECT_FLIP_FLAGS,
	DEFAULT_FLIP_FLAGS,
	OBJECT_EDIT_PARAMS,
	DEFAULT_EDIT_PARAMS,
	EDIT_PARAMS,
	EditParamIds,
	ObjectNames,
} from "@/lib/stgy";
import { COLOR_CHANGEABLE_OBJECT_IDS } from "@/components/board/ObjectRenderer/constants";
import type { BoardObject } from "@/lib/stgy";
import type { BatchUpdatePayload } from "@/lib/editor/types";
import { Badge } from "@/components/ui/badge";
import {
	PropertySection,
	SliderInput,
	Checkbox,
	NumberInput,
} from "./FormInputs";
import { ColorPalette } from "./ColorPalette";
import {
	computeBatchPropertyValues,
	haveSameObjectId,
	isMixed,
	getCommonFlipFlags,
	type BatchPropertyValues,
} from "@/lib/editor/batchUtils";

/**
 * バッチプロパティパネルのProps
 */
export interface BatchPropertyPanelProps {
	/** 選択されたオブジェクト配列 */
	objects: BoardObject[];
	/** 一括更新時のコールバック */
	onUpdate: (updates: BatchUpdatePayload) => void;
	/** 履歴コミット時のコールバック */
	onCommitHistory: (description: string) => void;
}

/**
 * Mixed値インジケーター
 */
function MixedIndicator() {
	const { t } = useTranslation();
	return (
		<span className="text-xs text-muted-foreground italic">
			{t("batchProperty.mixed", "複数の値")}
		</span>
	);
}

/**
 * バッチプロパティパネル
 */
export function BatchPropertyPanel({
	objects,
	onUpdate,
	onCommitHistory,
}: BatchPropertyPanelProps) {
	const { t } = useTranslation();
	const { debugMode } = useDebugMode();

	// 共通プロパティ値を計算
	const batchValues = useMemo(
		() => computeBatchPropertyValues(objects),
		[objects],
	);

	// 全オブジェクトが同じobjectIdか判定
	const sameObjectId = useMemo(() => haveSameObjectId(objects), [objects]);
	const commonObjectId = sameObjectId ? objects[0].objectId : null;

	// 共通のフリップフラグを取得
	const flipFlags = useMemo(() => {
		return getCommonFlipFlags(objects, OBJECT_FLIP_FLAGS, DEFAULT_FLIP_FLAGS);
	}, [objects]);

	// すべてのオブジェクトが色変更可能かどうか
	const allColorChangeable = useMemo(() => {
		return objects.every((obj) =>
			COLOR_CHANGEABLE_OBJECT_IDS.has(obj.objectId),
		);
	}, [objects]);

	// ハンドラー
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
			onCommitHistory(t("batchProperty.visibilityChanged", "表示状態変更"));
		},
		[onUpdate, onCommitHistory, t],
	);

	const handleFlipHorizontalChange = useCallback(
		(flipHorizontal: boolean) => {
			onUpdate({ flags: { flipHorizontal } });
			onCommitHistory(t("batchProperty.flipChanged", "反転変更"));
		},
		[onUpdate, onCommitHistory, t],
	);

	const handleFlipVerticalChange = useCallback(
		(flipVertical: boolean) => {
			onUpdate({ flags: { flipVertical } });
			onCommitHistory(t("batchProperty.flipChanged", "反転変更"));
		},
		[onUpdate, onCommitHistory, t],
	);

	const handleLockedChange = useCallback(
		(locked: boolean) => {
			onUpdate({ flags: { locked } });
			onCommitHistory(t("batchProperty.lockChanged", "ロック変更"));
		},
		[onUpdate, onCommitHistory, t],
	);

	// カラーピッカー用の表示色を決定
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
		<div className="panel h-full overflow-y-auto">
			<div className="panel-header">
				<h2 className="panel-title">{t("batchProperty.title", "一括編集")}</h2>
			</div>

			<div className="p-4 space-y-1">
				{/* 選択情報 */}
				<div className="mb-4">
					<div className="text-xs font-medium mb-1.5 uppercase tracking-wide text-muted-foreground font-display">
						{t("batchProperty.selection", "選択")}
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<Badge variant="secondary" className="font-mono text-xs">
							{t("batchProperty.objectCount", "{{count}}個のオブジェクト", {
								count: objects.length,
							})}
						</Badge>
						{sameObjectId && commonObjectId && (
							<span className="text-sm text-muted-foreground">
								{ObjectNames[commonObjectId]}
							</span>
						)}
					</div>
				</div>

				{/* 変形 */}
				<PropertySection title={t("batchProperty.transform", "変形")}>
					<div className="space-y-3">
						{/* 回転 */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									{t("batchProperty.rotation", "回転")}
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
										t("batchProperty.rotationChanged", "回転変更"),
									)
								}
							/>
						</div>
						{/* サイズ */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									{t("batchProperty.size", "サイズ")}
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
									onCommitHistory(t("batchProperty.sizeChanged", "サイズ変更"))
								}
							/>
						</div>
					</div>
				</PropertySection>

				{/* 色 */}
				<PropertySection title={t("batchProperty.color", "色")}>
					<div className="space-y-3">
						{/* カラーピッカー（デバッグモード時のみ・すべて色変更可能オブジェクトの場合のみ） */}
						{debugMode && allColorChangeable && (
							<div className="flex items-center gap-3">
								<div className="relative rounded-md overflow-hidden border-2 border-border">
									<input
										type="color"
										value={displayColor}
										onChange={(e) => handleColorChange(e.target.value)}
										onBlur={() =>
											onCommitHistory(t("batchProperty.colorChanged", "色変更"))
										}
										className="w-10 h-8 cursor-pointer border-0 bg-transparent"
									/>
								</div>
								{isColorMixed && <MixedIndicator />}
							</div>
						)}
						{/* カラーパレット（すべて色変更可能オブジェクトの場合のみ） */}
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
									onCommitHistory(t("batchProperty.colorChanged", "色変更"));
								}}
							/>
						)}
						{/* 透過度 */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									{t("batchProperty.opacity", "透過度")}
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
										t("batchProperty.opacityChanged", "透過度変更"),
									)
								}
							/>
						</div>
					</div>
				</PropertySection>

				{/* 状態 */}
				<PropertySection title={t("batchProperty.state", "状態")}>
					<div className="space-y-2.5">
						{/* 表示 */}
						<div className="flex items-center justify-between">
							<Checkbox
								label={t("batchProperty.visible", "表示")}
								checked={
									isMixed(batchValues.flags.visible)
										? true
										: batchValues.flags.visible
								}
								onChange={handleVisibleChange}
							/>
							{isMixed(batchValues.flags.visible) && <MixedIndicator />}
						</div>
						{/* 左右反転 */}
						{flipFlags.horizontal && (
							<div className="flex items-center justify-between">
								<Checkbox
									label={t("batchProperty.flipHorizontal", "左右反転")}
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
						{/* 上下反転 */}
						{flipFlags.vertical && (
							<div className="flex items-center justify-between">
								<Checkbox
									label={t("batchProperty.flipVertical", "上下反転")}
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
						{/* ロック */}
						<div className="flex items-center justify-between">
							<Checkbox
								label={t("batchProperty.locked", "ロック")}
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

				{/* オブジェクト固有パラメータ（同じobjectIdの場合のみ） */}
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

/**
 * オブジェクト固有パラメータセクション
 */
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

	// 標準パラメータ（サイズ、回転、透過度）を除外
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
			title={t("batchProperty.specificParams", "固有パラメータ")}
		>
			<div className="space-y-3">
				{additionalParams.map((paramId) => {
					const paramDef = EDIT_PARAMS[paramId];
					if (!paramDef) return null;

					// パラメータIDに応じてparam1/param2/param3を決定
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
					const displayValue = isMixedValue
						? paramDef.defaultValue
						: (value ?? paramDef.defaultValue);

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
											`${paramDef.name}${t("batchProperty.changed", "変更")}`,
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
											`${paramDef.name}${t("batchProperty.changed", "変更")}`,
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
