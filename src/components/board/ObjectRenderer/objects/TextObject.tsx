import type { Color } from "@/lib/stgy";
import { colorToRgba } from "../utils";

export function TextObject({
	transform,
	text,
	color,
}: {
	transform: string;
	text: string;
	color: Color;
}) {
	return (
		<text
			transform={transform}
			textAnchor="middle"
			dy="5"
			fill={colorToRgba(color)}
			fontSize="14"
			stroke="#000000"
			strokeWidth="1"
			paintOrder="stroke"
		>
			{text}
		</text>
	);
}
