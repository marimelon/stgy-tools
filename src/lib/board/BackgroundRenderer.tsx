/**
 * 背景レンダラー（共通コンポーネント）
 * サーバーサイド・クライアントサイド両方で使用
 */

import type { BackgroundId } from "@/lib/stgy/types";
import { BACKGROUND_SIZES } from "./constants";

interface BackgroundRendererProps {
	backgroundId: BackgroundId;
	width: number;
	height: number;
}

/**
 * チェッカーパターンの定義
 */
export function CheckerPattern({ id }: { id: string }) {
	return (
		<defs>
			<pattern id={id} patternUnits="userSpaceOnUse" width="32" height="32">
				<rect width="32" height="32" fill="#2a2a2a" />
				<rect width="16" height="16" fill="#3a3a3a" />
				<rect x="16" y="16" width="16" height="16" fill="#3a3a3a" />
			</pattern>
		</defs>
	);
}

/**
 * 背景レンダラー
 */
export function BackgroundRenderer({
	backgroundId,
	width,
	height,
}: BackgroundRendererProps) {
	const cx = width / 2;
	const cy = height / 2;
	const radius = Math.min(width, height) / 2 - 10;
	const squareSize = Math.min(width, height) - 20;
	const squareGraySize =
		BACKGROUND_SIZES.SQUARE_GRAY_BASE * BACKGROUND_SIZES.SQUARE_GRAY_MULTIPLIER;

	switch (backgroundId) {
		case 1: // 設定なし
			return null;

		case 2: // 全面チェック
			return (
				<g>
					<rect width={width} height={height} fill="#2a2a2a" />
					<CheckerPattern id="full-checker" />
					<rect width={width} height={height} fill="url(#full-checker)" />
				</g>
			);

		case 3: // 円形チェック
			return (
				<g>
					<CheckerPattern id="circle-checker" />
					<circle cx={cx} cy={cy} r={radius} fill="url(#circle-checker)" />
					<circle
						cx={cx}
						cy={cy}
						r={radius}
						fill="none"
						stroke="#666"
						strokeWidth="2"
					/>
				</g>
			);

		case 4: // 正方形チェック
			return (
				<g>
					<CheckerPattern id="square-checker" />
					<rect
						x={(width - squareSize) / 2}
						y={(height - squareSize) / 2}
						width={squareSize}
						height={squareSize}
						fill="url(#square-checker)"
					/>
					<rect
						x={(width - squareSize) / 2}
						y={(height - squareSize) / 2}
						width={squareSize}
						height={squareSize}
						fill="none"
						stroke="#666"
						strokeWidth="2"
					/>
				</g>
			);

		case 5: // 全面グレー
			return <rect width={width} height={height} fill="#3a3a3a" />;

		case 6: // 円形グレー
			return (
				<g>
					<circle cx={cx} cy={cy} r={radius} fill="#3a3a3a" />
					<circle
						cx={cx}
						cy={cy}
						r={radius}
						fill="none"
						stroke="#666"
						strokeWidth="2"
					/>
				</g>
			);

		case 7: // 正方形グレー
			return (
				<g>
					<rect
						x={(width - squareGraySize) / 2}
						y={(height - squareGraySize) / 2}
						width={squareGraySize}
						height={squareGraySize}
						fill="#3a3a3a"
					/>
					<rect
						x={(width - squareGraySize) / 2}
						y={(height - squareGraySize) / 2}
						width={squareGraySize}
						height={squareGraySize}
						fill="none"
						stroke="#666"
						strokeWidth="2"
					/>
				</g>
			);

		default:
			return null;
	}
}

