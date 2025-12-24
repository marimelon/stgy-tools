import i18n from "@/lib/i18n";
import type { BoardObject } from "@/lib/stgy";
import { ObjectIds } from "@/lib/stgy";
import { getObjectBoundingBox } from "./bounding-box";
import { AoEObject } from "./objects/AoEObject";
import { EnemyIcon } from "./objects/EnemyIcon";
import { FieldObject } from "./objects/FieldObject";
import { JobIcon } from "./objects/JobIcon";
import { MarkerIcon } from "./objects/markers/MarkerIcon";
import { PlaceholderObject } from "./objects/PlaceholderObject";
import { RoleIcon } from "./objects/RoleIcon";
import { TextObject } from "./objects/TextObject";
import { WaymarkIcon } from "./objects/WaymarkIcon";
import {
	isAoEObject,
	isEnemy,
	isFieldObject,
	isJobIcon,
	isMarker,
	isRoleIcon,
	isWaymark,
} from "./type-guards";
import { BoundingBox, DebugInfo, SelectionIndicator } from "./ui-components";
import { buildTransform, CustomIconImage, colorToRgba } from "./utils";

// Re-export for external use
export { getObjectBoundingBox } from "./bounding-box";

interface ObjectRendererProps {
	object: BoardObject;
	index: number;
	showBoundingBox?: boolean;
	selected?: boolean;
	onSelect?: (index: number) => void;
}

export function ObjectRenderer({
	object,
	index,
	showBoundingBox = false,
	selected = false,
	onSelect,
}: ObjectRendererProps) {
	const {
		objectId,
		position,
		rotation,
		size,
		color,
		flags,
		text,
		param1,
		param2,
	} = object;
	const scale = size / 100;

	// 変換を適用
	const transform = buildTransform(
		position.x,
		position.y,
		rotation,
		scale,
		flags.flipHorizontal,
		flags.flipVertical,
	);

	// バウンディングボックスのサイズを取得
	const bbox = getObjectBoundingBox(
		objectId,
		param1,
		param2,
		object.param3,
		text,
		position,
	);

	// クリックハンドラ
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onSelect?.(index);
	};

	// オブジェクトタイプに応じてレンダリング
	let content: React.ReactNode;

	if (isFieldObject(objectId)) {
		content = (
			<FieldObject objectId={objectId} transform={transform} color={color} />
		);
	} else if (objectId === ObjectIds.Line) {
		// Line: 始点(position)から終点(param1/10, param2/10)への線
		// param1, param2 は座標を10倍した整数値（小数第一位まで対応）
		const endX = (param1 ?? position.x * 10 + 2560) / 10;
		const endY = (param2 ?? position.y * 10) / 10;
		const lineThickness = object.param3 ?? 6;
		const lineFill = colorToRgba(color);
		content = (
			<line
				x1={position.x}
				y1={position.y}
				x2={endX}
				y2={endY}
				stroke={lineFill}
				strokeWidth={lineThickness}
				strokeLinecap="butt"
			/>
		);
	} else if (isAoEObject(objectId)) {
		content = (
			<AoEObject
				objectId={objectId}
				transform={transform}
				color={color}
				param1={param1}
				param2={param2}
				param3={object.param3}
			/>
		);
	} else if (isJobIcon(objectId)) {
		content = <JobIcon objectId={objectId} transform={transform} />;
	} else if (isRoleIcon(objectId)) {
		content = <RoleIcon objectId={objectId} transform={transform} />;
	} else if (isWaymark(objectId)) {
		content = <WaymarkIcon objectId={objectId} transform={transform} />;
	} else if (isEnemy(objectId)) {
		content = <EnemyIcon objectId={objectId} transform={transform} />;
	} else if (isMarker(objectId)) {
		content = <MarkerIcon objectId={objectId} transform={transform} />;
	} else if (objectId === ObjectIds.Text) {
		content = (
			<TextObject
				transform={transform}
				text={text || i18n.t("common.defaultText")}
				color={color}
			/>
		);
	} else if (objectId === ObjectIds.Group) {
		// グループアイコン - オリジナル画像を使用
		content = <CustomIconImage objectId={objectId} transform={transform} />;
	} else {
		content = <PlaceholderObject objectId={objectId} transform={transform} />;
	}

	// Lineは絶対座標で描画するため回転を適用しない
	const effectiveRotation = objectId === ObjectIds.Line ? 0 : rotation;

	// 選択インジケーター
	const selectionIndicator = selected && (
		<SelectionIndicator
			x={position.x}
			y={position.y}
			width={bbox.width * scale}
			height={bbox.height * scale}
			offsetX={(bbox.offsetX ?? 0) * scale}
			offsetY={(bbox.offsetY ?? 0) * scale}
			rotation={effectiveRotation}
		/>
	);

	// 透過度をSVGのopacityに変換 (color.opacity: 0=不透明, 100=透明)
	const svgOpacity = 1 - color.opacity / 100;

	return (
		// biome-ignore lint/a11y/useSemanticElements: SVG elements cannot be replaced with button
		<g
			role="button"
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={(e) =>
				e.key === "Enter" && handleClick(e as unknown as React.MouseEvent)
			}
			style={{ cursor: "pointer", opacity: svgOpacity, outline: "none" }}
		>
			{content}
			{selectionIndicator}
			{showBoundingBox && (
				<>
					<BoundingBox
						x={position.x}
						y={position.y}
						width={bbox.width * scale}
						height={bbox.height * scale}
						offsetX={(bbox.offsetX ?? 0) * scale}
						offsetY={(bbox.offsetY ?? 0) * scale}
						rotation={effectiveRotation}
						objectId={objectId}
					/>
					<DebugInfo object={object} />
				</>
			)}
		</g>
	);
}
