import {
	calculateLineEndpoint,
	colorToRgba,
	DEFAULT_PARAMS,
} from "@/lib/board";
import type { RenderProps, RenderStrategy } from "./types";

export const LineStrategy: RenderStrategy = {
	render({ object }: RenderProps) {
		const { position, param1, param2, param3, color } = object;

		// Line: 始点(position)から終点(param1/10, param2/10)への線
		// param1, param2 は座標を10倍した整数値（小数第一位まで対応）
		const endpoint = calculateLineEndpoint(position, param1, param2);
		const lineThickness = param3 ?? DEFAULT_PARAMS.LINE_THICKNESS;
		const lineFill = colorToRgba(color);

		// ハンドル画像のサイズ（画像は20x20px程度を想定）
		const handleSize = 20;
		const handleOffset = handleSize / 2;

		return (
			<>
				<line
					x1={position.x}
					y1={position.y}
					x2={endpoint.x}
					y2={endpoint.y}
					stroke={lineFill}
					strokeWidth={lineThickness}
					strokeLinecap="butt"
				/>
				{/* 始点のハンドル */}
				<image
					href="/assets/uld/TofuHandle_hr1_0.png"
					x={position.x - handleOffset}
					y={position.y - handleOffset}
					width={handleSize}
					height={handleSize}
				/>
				{/* 終点のハンドル */}
				<image
					href="/assets/uld/TofuHandle_hr1_0.png"
					x={endpoint.x - handleOffset}
					y={endpoint.y - handleOffset}
					width={handleSize}
					height={handleSize}
				/>
			</>
		);
	},
};
