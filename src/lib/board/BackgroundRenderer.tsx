/**
 * 背景レンダラー（共通コンポーネント）
 * サーバーサイド・クライアントサイド両方で使用
 */

import { useCallback, useState } from "react";
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
 * - クライアント: /assets/backgrounds-hr/{id}.png を優先、なければ /assets/backgrounds/{id}.png にフォールバック
 * - サーバー: imageDataUri (Base64) を使用
 */
export function BackgroundRenderer({
	backgroundId,
	width,
	height,
	imageDataUri,
}: BackgroundRendererProps) {
	const [useHr, setUseHr] = useState(true);

	const handleError = useCallback(() => {
		// HR版が見つからない場合、通常版にフォールバック
		if (useHr) {
			setUseHr(false);
		}
	}, [useHr]);

	// BackgroundId 1-7 が有効な範囲
	if (backgroundId < 1 || backgroundId > 7) {
		return null;
	}

	// サーバーサイドはData URIを使用、クライアントはHR版優先でフォールバック
	const href =
		imageDataUri ??
		(useHr
			? `/assets/backgrounds-hr/${backgroundId}.png`
			: `/assets/backgrounds/${backgroundId}.png`);

	return (
		<image
			href={href}
			x={0}
			y={0}
			width={width}
			height={height}
			onError={handleError}
		/>
	);
}
