/**
 * Color palette component
 *
 * Displays 56 preset colors and allows selection by click
 */

import { COLOR_PALETTE, rgbToHex } from "@/lib/editor";

export interface ColorPaletteProps {
	currentColor?: { r: number; g: number; b: number };
	onColorSelect: (color: { r: number; g: number; b: number }) => void;
}

export function ColorPalette({
	currentColor,
	onColorSelect,
}: ColorPaletteProps) {
	const isCurrentColor = (color: { r: number; g: number; b: number }) => {
		if (!currentColor) return false;
		return (
			currentColor.r === color.r &&
			currentColor.g === color.g &&
			currentColor.b === color.b
		);
	};

	return (
		<div className="grid grid-cols-8 gap-0.5">
			{COLOR_PALETTE.flat().map((color, index) => {
				const hex = rgbToHex(color.r, color.g, color.b);
				const isSelected = isCurrentColor(color);

				return (
					<button
						key={`${index}-${hex}`}
						type="button"
						className={`
              w-5 h-5 rounded-sm cursor-pointer transition-all
              hover:scale-110 hover:z-10 hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
              ${isSelected ? "ring-2 ring-primary ring-offset-1 scale-110 z-10" : ""}
            `}
						style={{
							backgroundColor: hex,
							border:
								color.r > 240 && color.g > 240 && color.b > 240
									? "1px solid var(--border)"
									: "none",
						}}
						onClick={() => onColorSelect(color)}
						title={`RGB(${color.r}, ${color.g}, ${color.b})`}
						aria-label={`Select color: RGB(${color.r}, ${color.g}, ${color.b})`}
					/>
				);
			})}
		</div>
	);
}
