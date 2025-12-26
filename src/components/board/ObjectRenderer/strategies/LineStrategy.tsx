import { colorToRgba } from "../utils";
import type { RenderProps, RenderStrategy } from "./types";

export const LineStrategy: RenderStrategy = {
	render({ object }: RenderProps) {
		const { position, param1, param2, param3, color } = object;

		// Line: 始点(position)から終点(param1/10, param2/10)への線
		// param1, param2 は座標を10倍した整数値（小数第一位まで対応）
		const endX = (param1 ?? position.x * 10 + 2560) / 10;
		const endY = (param2 ?? position.y * 10) / 10;
		const lineThickness = param3 ?? 6;
		const lineFill = colorToRgba(color);

		return (
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
	},
};
