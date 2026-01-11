/**
 * Color conversion utilities
 */

/**
 * Convert RGB values to Hex string
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Hex string (e.g., "#ff0000")
 */
export function rgbToHex(r: number, g: number, b: number): string {
	return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Convert Hex string to RGB values
 * @param hex - Hex string (e.g., "#ff0000" or "ff0000")
 * @returns RGB value object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: Number.parseInt(result[1], 16),
				g: Number.parseInt(result[2], 16),
				b: Number.parseInt(result[3], 16),
			}
		: { r: 0, g: 0, b: 0 };
}

/**
 * Preset color palette (56 colors: 7 rows x 8 columns)
 *
 * Column color families:
 * - Column 1: Grayscale (white to dark gray)
 * - Column 2: Red family (pink to mauve)
 * - Column 3: Orange family (peach to beige)
 * - Column 4: Yellow family (lemon to khaki)
 * - Column 5: Green family (mint to emerald)
 * - Column 6: Cyan family (aqua to turquoise)
 * - Column 7: Blue family (sky blue to lavender)
 * - Column 8: Pink/purple family (magenta to orchid)
 */
export const COLOR_PALETTE: { r: number; g: number; b: number }[][] = [
	// Row 1: Pastel colors
	[
		{ r: 255, g: 255, b: 255 }, // White
		{ r: 255, g: 189, b: 191 }, // Light pink
		{ r: 255, g: 224, b: 200 }, // Light orange
		{ r: 255, g: 248, b: 176 }, // Light yellow
		{ r: 233, g: 255, b: 226 }, // Light green
		{ r: 232, g: 255, b: 254 }, // Light cyan
		{ r: 156, g: 208, b: 244 }, // Light blue
		{ r: 255, g: 220, b: 255 }, // Light magenta
	],
	// Row 2: Primary/basic colors
	[
		{ r: 248, g: 248, b: 248 }, // Light gray
		{ r: 255, g: 0, b: 0 }, // Red
		{ r: 255, g: 128, b: 0 }, // Orange
		{ r: 255, g: 255, b: 0 }, // Yellow
		{ r: 0, g: 255, b: 0 }, // Green
		{ r: 0, g: 255, b: 255 }, // Cyan
		{ r: 0, g: 0, b: 255 }, // Blue
		{ r: 255, g: 0, b: 255 }, // Magenta
	],
	// Row 3
	[
		{ r: 224, g: 224, b: 224 }, // Light gray
		{ r: 255, g: 76, b: 76 }, // Bright red
		{ r: 255, g: 166, b: 102 }, // Bright orange
		{ r: 255, g: 255, b: 178 }, // Cream yellow
		{ r: 128, g: 255, b: 0 }, // Lime green
		{ r: 188, g: 255, b: 240 }, // Mint green
		{ r: 0, g: 128, b: 255 }, // Sky blue
		{ r: 226, g: 96, b: 144 }, // Rose pink
	],
	// Row 4
	[
		{ r: 216, g: 216, b: 216 }, // Gray
		{ r: 255, g: 127, b: 127 }, // Coral pink
		{ r: 255, g: 206, b: 172 }, // Peach
		{ r: 255, g: 222, b: 115 }, // Golden yellow
		{ r: 128, g: 248, b: 96 }, // Bright green
		{ r: 102, g: 230, b: 255 }, // Aqua blue
		{ r: 148, g: 192, b: 255 }, // Light blue
		{ r: 255, g: 140, b: 198 }, // Hot pink
	],
	// Row 5
	[
		{ r: 204, g: 204, b: 204 }, // Gray
		{ r: 255, g: 192, b: 192 }, // Baby pink
		{ r: 255, g: 104, b: 0 }, // Vivid orange
		{ r: 240, g: 200, b: 108 }, // Honey yellow
		{ r: 212, g: 255, b: 127 }, // Yellow green
		{ r: 172, g: 220, b: 230 }, // Powder blue
		{ r: 128, g: 128, b: 255 }, // Purple blue
		{ r: 255, g: 184, b: 224 }, // Light pink
	],
	// Row 6
	[
		{ r: 191, g: 191, b: 191 }, // Medium gray
		{ r: 216, g: 192, b: 192 }, // Dusty rose
		{ r: 216, g: 104, b: 108 }, // Dark coral
		{ r: 204, g: 204, b: 102 }, // Olive yellow
		{ r: 172, g: 216, b: 72 }, // Apple green
		{ r: 176, g: 232, b: 232 }, // Pale cyan
		{ r: 179, g: 140, b: 255 }, // Lavender
		{ r: 224, g: 168, b: 188 }, // Dusty pink
	],
	// Row 7
	[
		{ r: 166, g: 166, b: 166 }, // Dark gray
		{ r: 198, g: 162, b: 162 }, // Mauve
		{ r: 216, g: 190, b: 172 }, // Beige
		{ r: 200, g: 192, b: 160 }, // Khaki
		{ r: 58, g: 232, b: 180 }, // Emerald green
		{ r: 60, g: 232, b: 232 }, // Turquoise
		{ r: 224, g: 192, b: 248 }, // Light lavender
		{ r: 224, g: 136, b: 244 }, // Orchid
	],
];

/** Number of palette rows */
export const COLOR_PALETTE_ROWS = 7;

/** Number of palette columns */
export const COLOR_PALETTE_COLS = 8;
