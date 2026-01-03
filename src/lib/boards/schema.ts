/**
 * Board storage schema definitions using Zod
 */

import { z } from "zod";

// ObjectGroup schema (mirrors editor/types.ts)
const objectGroupSchema = z.object({
	id: z.string(),
	objectIndices: z.array(z.number()),
	name: z.string().optional(),
	collapsed: z.boolean().optional(),
});

// OverlaySettings schema (mirrors editor/types.ts)
const squareGridSizeSchema = z.union([
	z.literal(16),
	z.literal(24),
	z.literal(32),
	z.literal(48),
	z.literal(64),
]);

const overlaySettingsSchema = z.object({
	circleCount: z.number().min(3).max(10).optional().default(5),
	squareGridSize: squareGridSizeSchema.optional().default(32),
	colorId: z
		.enum(["cyan", "red", "green", "yellow", "white"])
		.optional()
		.default("cyan"),
	opacity: z.number().min(20).max(100).optional().default(40),
	showCenterMarker: z.boolean().optional().default(true),
	showGuideLines: z.boolean().optional().default(true),
	showBorder: z.boolean().optional().default(true),
});

// Default overlay settings
const DEFAULT_OVERLAY_SETTINGS = {
	circleCount: 5,
	squareGridSize: 32,
	colorId: "cyan",
	opacity: 40,
	showCenterMarker: true,
	showGuideLines: true,
	showBorder: true,
} as const;

// GridSettings schema (mirrors editor/types.ts)
const gridSettingsSchema = z.object({
	enabled: z.boolean(),
	size: z.number(),
	showGrid: z.boolean(),
	// Editor overlay grid type (added for editing support)
	overlayType: z
		.enum(["none", "concentric", "square"])
		.optional()
		.default("none"),
	// Show game background
	showBackground: z.boolean().optional().default(true),
	// Canvas background color (when background is hidden)
	canvasColor: z
		.enum([
			"slate-900",
			"slate-800",
			"slate-700",
			"neutral-900",
			"green-950",
			"blue-950",
		])
		.optional()
		.default("slate-800"),
	// Overlay detailed settings
	overlaySettings: overlaySettingsSchema
		.optional()
		.default(DEFAULT_OVERLAY_SETTINGS),
});

// Main board storage schema
export const storedBoardSchema = z.object({
	id: z.string(),
	name: z.string(),
	stgyCode: z.string(),
	encodeKey: z.number().min(0).max(63).optional(), // 後方互換性のため残すが、新規保存では使用しない
	groups: z.array(objectGroupSchema),
	gridSettings: gridSettingsSchema,
	createdAt: z.string(),
	updatedAt: z.string(),
	// SHA-256 hash of decoded binary data (for content-based duplicate detection)
	// Optional for backward compatibility with existing data
	contentHash: z.string().optional(),
});

export type StoredBoard = z.infer<typeof storedBoardSchema>;

// Default grid settings
export const DEFAULT_GRID_SETTINGS = {
	enabled: false,
	size: 16,
	showGrid: false,
	overlayType: "none",
	showBackground: true,
	canvasColor: "slate-800",
	overlaySettings: DEFAULT_OVERLAY_SETTINGS,
} as const;
