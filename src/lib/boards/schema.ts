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

// GridSettings schema (mirrors editor/types.ts)
const gridSettingsSchema = z.object({
	enabled: z.boolean(),
	size: z.number(),
	showGrid: z.boolean(),
});

// Main board storage schema
export const storedBoardSchema = z.object({
	id: z.string(),
	name: z.string(),
	stgyCode: z.string(),
	encodeKey: z.number().min(0).max(63),
	groups: z.array(objectGroupSchema),
	gridSettings: gridSettingsSchema,
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type StoredBoard = z.infer<typeof storedBoardSchema>;

// Default grid settings
export const DEFAULT_GRID_SETTINGS = {
	enabled: false,
	size: 16,
	showGrid: false,
} as const;
