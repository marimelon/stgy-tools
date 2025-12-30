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

// Re-export from @/lib/board for backwards compatibility
export { buildTransform, colorToRgba, isColorChanged, isLineAoEParamsChanged };

/**
 * オリジナル画像（PNG）を使用するかチェック
 * デフォルトでオリジナル画像を使用
 * localStorage.setItem('useFallbackSvg', 'true') で代替SVGに切り替え可能
 */
export function useOriginalIcons(): boolean {
	if (typeof window === "undefined") return true;
	return localStorage.getItem("useFallbackSvg") !== "true";
}

/**
 * カスタムアイコン画像をレンダリング
 * OBJECT_BBOX_SIZESのサイズを使用してバウンディングボックス内に収める
 */
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
 * オリジナル画像が利用可能な場合は画像を返し、そうでなければnullを返す
 * 色やパラメータがデフォルトから変更されている場合はSVGでレンダリングするためnullを返す
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
	// 色変更可能なオブジェクト（LineAoE, Line, Text）のみ色変更をチェック
	// それ以外のオブジェクトは色が設定されていてもオリジナル画像を使用
	if (
		COLOR_CHANGEABLE_OBJECT_IDS.has(objectId) &&
		color &&
		isColorChanged(color)
	)
		return null;
	// 直線範囲攻撃のパラメータが変更されている場合はSVGでレンダリング
	if (isLineAoEParamsChanged(objectId, param1, param2)) return null;
	return <CustomIconImage objectId={objectId} transform={transform} />;
}
