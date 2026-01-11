/**
 * Board property panel component
 */

import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
	CANVAS_COLORS,
	type CanvasColorId,
	EDITOR_OVERLAY_TYPES,
	type EditorOverlayType,
	GRID_SIZES,
	OVERLAY_COLORS,
	OVERLAY_GRID_SIZES,
	type OverlayColorId,
	type OverlaySettings,
	useBackgroundId,
	useBoardName,
	useEditorActions,
	useGridSettings,
} from "@/lib/editor";
import { useDebugMode } from "@/lib/settings";
import type { BackgroundId } from "@/lib/stgy";
import { BackgroundId as BgId, MAX_BOARD_NAME_LENGTH } from "@/lib/stgy";
import { PropertySection } from "./FormInputs";

const OVERLAY_TYPE_LABELS: Record<EditorOverlayType, string> = {
	none: "toolbar.overlayNone",
	concentric: "toolbar.overlayConcentric",
	square: "toolbar.overlaySquare",
};

const BACKGROUND_IDS: BackgroundId[] = [
	BgId.None,
	BgId.FullCheck,
	BgId.CircleCheck,
	BgId.SquareCheck,
	BgId.FullGray,
	BgId.CircleGray,
	BgId.SquareGray,
];

export interface BoardPropertyPanelProps {
	onUpdateMeta: (updates: {
		name?: string;
		backgroundId?: BackgroundId;
	}) => void;
	onCommitHistory: (description: string) => void;
}

/**
 * Uses fine-grained selectors (useBoardName/useBackgroundId) to avoid
 * re-rendering on object movement.
 */
export function BoardPropertyPanel({
	onUpdateMeta,
	onCommitHistory,
}: BoardPropertyPanelProps) {
	const { t } = useTranslation();
	const debugMode = useDebugMode();

	const boardName = useBoardName();
	const backgroundId = useBackgroundId();
	const gridSettings = useGridSettings();
	const { setGridSettings } = useEditorActions();

	// Unique IDs for accessibility
	const showBackgroundId = useId();
	const gridSnapId = useId();
	const showGridId = useId();
	const centerMarkerId = useId();
	const guideLinesId = useId();
	const borderId = useId();

	const updateOverlaySettings = (updates: Partial<OverlaySettings>) => {
		setGridSettings({
			overlaySettings: {
				...gridSettings.overlaySettings,
				...updates,
			},
		});
	};

	return (
		<div className="h-full overflow-y-auto">
			<div className="p-4 space-y-1">
				<PropertySection
					title={t("boardPanel.boardName")}
					rightContent={`${boardName.length}/${MAX_BOARD_NAME_LENGTH}`}
				>
					<Input
						type="text"
						value={boardName}
						onChange={(e) => onUpdateMeta({ name: e.target.value })}
						onCompositionEnd={(e) => {
							// Apply character limit on IME composition end
							if (!debugMode) {
								const value = e.currentTarget.value;
								if (value.length > MAX_BOARD_NAME_LENGTH) {
									onUpdateMeta({
										name: value.slice(0, MAX_BOARD_NAME_LENGTH),
									});
								}
							}
						}}
						onBlur={() => {
							// Apply character limit on blur (for non-IME input)
							if (!debugMode && boardName.length > MAX_BOARD_NAME_LENGTH) {
								onUpdateMeta({
									name: boardName.slice(0, MAX_BOARD_NAME_LENGTH),
								});
							}
							onCommitHistory(t("boardPanel.boardNameChanged"));
						}}
						placeholder={t("boardPanel.boardNamePlaceholder")}
					/>
				</PropertySection>

				<PropertySection title={t("boardPanel.background")}>
					<div className="flex items-center gap-2">
						<Select
							value={String(backgroundId)}
							onValueChange={(value) => {
								onUpdateMeta({ backgroundId: Number(value) as BackgroundId });
								onCommitHistory(t("boardPanel.backgroundChanged"));
							}}
						>
							<SelectTrigger className="flex-1">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{BACKGROUND_IDS.map((id) => (
									<SelectItem key={id} value={String(id)}>
										{t(`background.${id}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="flex items-center shrink-0">
							<Checkbox
								id={showBackgroundId}
								checked={gridSettings.showBackground}
								onCheckedChange={(checked) =>
									setGridSettings({ showBackground: checked === true })
								}
							/>
							<label
								htmlFor={showBackgroundId}
								className="ml-1.5 text-xs text-slate-400 cursor-pointer"
							>
								{t("toolbar.show")}
							</label>
						</div>
					</div>
				</PropertySection>

				{!gridSettings.showBackground && (
					<PropertySection title={t("boardPanel.canvasColor")}>
						<div className="flex items-center gap-1.5 flex-wrap">
							{CANVAS_COLORS.map((color) => (
								<button
									key={color.id}
									type="button"
									onClick={() =>
										setGridSettings({ canvasColor: color.id as CanvasColorId })
									}
									className={`w-6 h-6 rounded border-2 transition-all ${
										gridSettings.canvasColor === color.id
											? "border-cyan-400 scale-110"
											: "border-slate-600 hover:border-slate-400"
									}`}
									style={{ backgroundColor: color.color }}
									title={t(`canvasColor.${color.id}`)}
									aria-label={t(`canvasColor.${color.id}`)}
								/>
							))}
						</div>
					</PropertySection>
				)}

				<PropertySection title={t("toolbar.editorOverlay")}>
					<Select
						value={gridSettings.overlayType}
						onValueChange={(value) =>
							setGridSettings({ overlayType: value as EditorOverlayType })
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{EDITOR_OVERLAY_TYPES.map((type) => (
								<SelectItem key={type} value={type}>
									{t(OVERLAY_TYPE_LABELS[type])}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</PropertySection>

				{gridSettings.overlayType !== "none" && (
					<PropertySection title={t("overlaySettings.title")}>
						<div className="space-y-3">
							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<span className="text-xs text-slate-400">
										{t("overlaySettings.density")}
									</span>
									<span className="text-xs text-slate-300">
										{gridSettings.overlayType === "concentric"
											? gridSettings.overlaySettings.circleCount
											: `${gridSettings.overlaySettings.squareGridSize}px`}
									</span>
								</div>
								{gridSettings.overlayType === "concentric" ? (
									<Slider
										value={[gridSettings.overlaySettings.circleCount]}
										min={3}
										max={10}
										step={1}
										onValueChange={([value]) =>
											updateOverlaySettings({ circleCount: value })
										}
									/>
								) : (
									<Select
										value={String(gridSettings.overlaySettings.squareGridSize)}
										onValueChange={(value) =>
											updateOverlaySettings({
												squareGridSize: Number(
													value,
												) as OverlaySettings["squareGridSize"],
											})
										}
									>
										<SelectTrigger className="h-7">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{OVERLAY_GRID_SIZES.map((size) => (
												<SelectItem key={size} value={String(size)}>
													{size}px
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</div>

							<div className="space-y-1">
								<span className="text-xs text-slate-400">
									{t("overlaySettings.color")}
								</span>
								<div className="flex items-center gap-1.5">
									{OVERLAY_COLORS.map((color) => (
										<button
											key={color.id}
											type="button"
											onClick={() =>
												updateOverlaySettings({
													colorId: color.id as OverlayColorId,
												})
											}
											className={`w-5 h-5 rounded-full border-2 transition-all ${
												gridSettings.overlaySettings.colorId === color.id
													? "border-white scale-110"
													: "border-slate-600 hover:border-slate-400"
											}`}
											style={{
												backgroundColor: `rgb(${color.color})`,
											}}
											title={t(`overlayColor.${color.id}`)}
											aria-label={t(`overlayColor.${color.id}`)}
										/>
									))}
								</div>
							</div>

							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<span className="text-xs text-slate-400">
										{t("overlaySettings.opacity")}
									</span>
									<span className="text-xs text-slate-300">
										{gridSettings.overlaySettings.opacity}%
									</span>
								</div>
								<Slider
									value={[gridSettings.overlaySettings.opacity]}
									min={20}
									max={100}
									step={5}
									onValueChange={([value]) =>
										updateOverlaySettings({ opacity: value })
									}
								/>
							</div>

							<div className="flex flex-wrap gap-x-3 gap-y-1">
								<div className="flex items-center">
									<Checkbox
										id={centerMarkerId}
										checked={gridSettings.overlaySettings.showCenterMarker}
										onCheckedChange={(checked) =>
											updateOverlaySettings({
												showCenterMarker: checked === true,
											})
										}
									/>
									<label
										htmlFor={centerMarkerId}
										className="ml-1.5 text-xs text-slate-400 cursor-pointer"
									>
										{t("overlaySettings.centerMarker")}
									</label>
								</div>
								{gridSettings.overlayType === "concentric" && (
									<div className="flex items-center">
										<Checkbox
											id={guideLinesId}
											checked={gridSettings.overlaySettings.showGuideLines}
											onCheckedChange={(checked) =>
												updateOverlaySettings({
													showGuideLines: checked === true,
												})
											}
										/>
										<label
											htmlFor={guideLinesId}
											className="ml-1.5 text-xs text-slate-400 cursor-pointer"
										>
											{t("overlaySettings.guideLines")}
										</label>
									</div>
								)}
								{gridSettings.overlayType === "square" && (
									<div className="flex items-center">
										<Checkbox
											id={borderId}
											checked={gridSettings.overlaySettings.showBorder}
											onCheckedChange={(checked) =>
												updateOverlaySettings({
													showBorder: checked === true,
												})
											}
										/>
										<label
											htmlFor={borderId}
											className="ml-1.5 text-xs text-slate-400 cursor-pointer"
										>
											{t("overlaySettings.border")}
										</label>
									</div>
								)}
							</div>
						</div>
					</PropertySection>
				)}

				<PropertySection title={t("moreMenu.gridSnap")}>
					<div className="flex items-center gap-2 flex-wrap">
						<div className="flex items-center shrink-0">
							<Checkbox
								id={gridSnapId}
								checked={gridSettings.enabled}
								onCheckedChange={(checked) =>
									setGridSettings({ enabled: checked === true })
								}
							/>
							<label
								htmlFor={gridSnapId}
								className="ml-1.5 text-xs text-slate-400 cursor-pointer"
							>
								ON
							</label>
						</div>

						<Select
							value={String(gridSettings.size)}
							onValueChange={(value) =>
								setGridSettings({ size: Number(value) })
							}
							disabled={!gridSettings.enabled}
						>
							<SelectTrigger className="w-20">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{GRID_SIZES.map((size) => (
									<SelectItem key={size} value={String(size)}>
										{size}px
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="flex items-center shrink-0">
							<Checkbox
								id={showGridId}
								checked={gridSettings.showGrid}
								onCheckedChange={(checked) =>
									setGridSettings({ showGrid: checked === true })
								}
								disabled={!gridSettings.enabled}
							/>
							<label
								htmlFor={showGridId}
								className={`ml-1.5 text-xs cursor-pointer ${
									gridSettings.enabled ? "text-slate-400" : "text-slate-600"
								}`}
							>
								{t("toolbar.show")}
							</label>
						</div>
					</div>
				</PropertySection>
			</div>
		</div>
	);
}
