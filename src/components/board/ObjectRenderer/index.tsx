import type { BoardObject } from "@/lib/stgy";
import { ObjectIds } from "@/lib/stgy";
import { getObjectBoundingBox } from "./bounding-box";
import { getStrategy } from "./strategies";
import { BoundingBox, DebugInfo, SelectionIndicator } from "./ui-components";
import { buildTransform } from "./utils";

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

	// オブジェクトタイプに応じてレンダリング（ストラテジーパターン）
	const strategy = getStrategy(objectId);
	const content = strategy.render({
		object,
		transform,
		scale,
	});

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
