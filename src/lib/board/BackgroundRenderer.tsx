/**
 * 背景レンダラー（共通コンポーネント）
 * サーバーサイド・クライアントサイド両方で使用
 */

import type { BackgroundId } from "@/lib/stgy/types";

interface BackgroundRendererProps {
	backgroundId: BackgroundId;
	width: number;
	height: number;
	/** サーバーサイド用: Base64 Data URI */
	imageDataUri?: string;
}

/**
 * 背景レンダラー
 * BackgroundId に対応する画像を表示
 * - クライアント: /backgrounds/{id}.png を参照
 * - サーバー: imageDataUri (Base64) を使用
 */
export function BackgroundRenderer({
	backgroundId,
	width,
	height,
	imageDataUri,
}: BackgroundRendererProps) {
	// BackgroundId 1-7 が有効な範囲
	if (backgroundId < 1 || backgroundId > 7) {
		return null;
	}

	const href = imageDataUri ?? `/backgrounds/${backgroundId}.png`;

	return <image href={href} x={0} y={0} width={width} height={height} />;
}
