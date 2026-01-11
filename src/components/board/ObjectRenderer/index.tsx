import type { BoardObject } from "@/lib/stgy";
import { ObjectIds } from "@/lib/stgy";
import { getObjectBoundingBox } from "./bounding-box";
import { getStrategy } from "./strategies";
import { SelectionIndicator } from "./ui-components";
import { buildTransform } from "./utils";

// Re-export for external use
export { getObjectBoundingBox } from "./bounding-box";

interface ObjectRendererProps {
	object: BoardObject;
	selected?: boolean;
	onSelect?: (objectId: string) => void;
}

export function ObjectRenderer({
	object,
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

	const transform = buildTransform(
		position.x,
		position.y,
		rotation,
		scale,
		flags.flipHorizontal,
		flags.flipVertical,
	);

	const bbox = getObjectBoundingBox(
		objectId,
		param1,
		param2,
		object.param3,
		text,
		position,
	);

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onSelect?.(object.id);
	};

	const strategy = getStrategy(objectId);
	const content = strategy.render({
		object,
		transform,
		scale,
	});

	// Line uses absolute coordinates, so skip rotation
	const effectiveRotation = objectId === ObjectIds.Line ? 0 : rotation;

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

	// Convert opacity (0=opaque, 100=transparent) to SVG opacity
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
		</g>
	);
}
