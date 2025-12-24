import { OBJECT_BBOX_SIZES } from "@/lib/board";
import type { Color } from "@/lib/stgy";
import { ObjectIds } from "@/lib/stgy";
import {
	COLOR_CHANGEABLE_OBJECT_IDS,
	CUSTOM_ICON_IDS,
	DEFAULT_OBJECT_COLOR,
	DEFAULT_PARAMS,
	getIconPath,
} from "./constants";

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
 * 色がデフォルトから変更されているかチェック
 */
export function isColorChanged(color: Color): boolean {
	return (
		color.r !== DEFAULT_OBJECT_COLOR.r ||
		color.g !== DEFAULT_OBJECT_COLOR.g ||
		color.b !== DEFAULT_OBJECT_COLOR.b ||
		color.opacity !== DEFAULT_OBJECT_COLOR.opacity
	);
}

/**
 * 直線範囲攻撃のパラメータがデフォルトから変更されているかチェック
 * 縦幅・横幅パラメータを持つのはLineAoEのみ（Lineは異なるパラメータ構成）
 */
export function isLineAoEParamsChanged(
	objectId: number,
	param1?: number,
	param2?: number,
): boolean {
	// LineAoEのみが縦幅・横幅パラメータを持つ
	if (objectId !== ObjectIds.LineAoE) {
		return false;
	}
	// param1（縦幅）またはparam2（横幅）がデフォルトから変更されているか
	const height = param1 ?? DEFAULT_PARAMS.LINE_HEIGHT;
	const width = param2 ?? DEFAULT_PARAMS.LINE_WIDTH;
	return (
		height !== DEFAULT_PARAMS.LINE_HEIGHT || width !== DEFAULT_PARAMS.LINE_WIDTH
	);
}

/**
 * SVG transform属性を構築
 */
export function buildTransform(
	x: number,
	y: number,
	rotation: number,
	scale: number,
	flipH: boolean,
	flipV: boolean,
): string {
	const parts = [`translate(${x}, ${y})`];
	if (rotation !== 0) {
		parts.push(`rotate(${rotation})`);
	}
	const scaleX = flipH ? -scale : scale;
	const scaleY = flipV ? -scale : scale;
	if (scaleX !== 1 || scaleY !== 1) {
		parts.push(`scale(${scaleX}, ${scaleY})`);
	}
	return parts.join(" ");
}

/**
 * Color型をrgba文字列に変換
 */
export function colorToRgba(color: Color): string {
	const alpha = 1 - color.opacity / 100;
	return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
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
