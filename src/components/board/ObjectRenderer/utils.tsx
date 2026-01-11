import {
	buildTransform,
	colorToRgba,
	isColorChanged,
	isLineAoEParamsChanged,
	OBJECT_BBOX_SIZES,
} from "@/lib/board";
import type { Color } from "@/lib/stgy";
import {
	COLOR_CHANGEABLE_OBJECT_IDS,
	CUSTOM_ICON_IDS,
	getIconPath,
} from "./constants";

export { buildTransform, colorToRgba, isColorChanged, isLineAoEParamsChanged };

/**
 * Check if original PNG icons should be used.
 * Default is true. Set localStorage.setItem('useFallbackSvg', 'true') to use SVG fallback.
 */
export function useOriginalIcons(): boolean {
	if (typeof window === "undefined") return true;
	return localStorage.getItem("useFallbackSvg") !== "true";
}

/** Render custom icon image using OBJECT_BBOX_SIZES for proper sizing */
export function CustomIconImage({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const iconSize = OBJECT_BBOX_SIZES[objectId];
	if (!iconSize) return null;

	return (
		<g transform={transform}>
			<image
				href={getIconPath(objectId)}
				x={-iconSize.width / 2}
				y={-iconSize.height / 2}
				width={iconSize.width}
				height={iconSize.height}
				preserveAspectRatio="xMidYMid meet"
			/>
		</g>
	);
}

/**
 * Return original image if available, null otherwise.
 * Returns null if color or parameters are changed from defaults (use SVG rendering).
 */
export function renderOriginalIconIfEnabled(
	objectId: number,
	transform: string,
	color?: Color,
	param1?: number,
	param2?: number,
): React.ReactNode | null {
	if (!useOriginalIcons()) return null;
	if (!CUSTOM_ICON_IDS.has(objectId)) return null;
	if (
		COLOR_CHANGEABLE_OBJECT_IDS.has(objectId) &&
		color &&
		isColorChanged(color)
	)
		return null;
	if (isLineAoEParamsChanged(objectId, param1, param2)) return null;
	return <CustomIconImage objectId={objectId} transform={transform} />;
}
