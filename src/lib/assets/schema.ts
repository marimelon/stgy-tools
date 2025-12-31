/**
 * Asset storage schema definitions using Zod
 */

import { z } from "zod";

/**
 * Current schema version for assets
 * Increment when making breaking changes to the schema
 */
export const ASSET_SCHEMA_VERSION = 1;

// Color schema (mirrors stgy/types.ts)
const colorSchema = z.object({
	r: z.number(),
	g: z.number(),
	b: z.number(),
	opacity: z.number(),
});

// Position schema (mirrors stgy/types.ts)
const positionSchema = z.object({
	x: z.number(),
	y: z.number(),
});

// ObjectFlags schema (mirrors stgy/types.ts)
const objectFlagsSchema = z.object({
	visible: z.boolean(),
	flipHorizontal: z.boolean(),
	flipVertical: z.boolean(),
	locked: z.boolean(),
});

// BoardObject schema (mirrors stgy/types.ts)
const boardObjectSchema = z.object({
	objectId: z.number(),
	text: z.string().optional(),
	flags: objectFlagsSchema,
	position: positionSchema,
	rotation: z.number(),
	size: z.number(),
	color: colorSchema,
	param1: z.number().optional(),
	param2: z.number().optional(),
	param3: z.number().optional(),
});

// Asset bounds schema (for preview positioning)
const assetBoundsSchema = z.object({
	minX: z.number(),
	minY: z.number(),
	maxX: z.number(),
	maxY: z.number(),
});

// Main asset storage schema
export const storedAssetSchema = z.object({
	id: z.string(),
	version: z.number(),
	name: z.string(),
	category: z.string().optional(),
	objects: z.array(boardObjectSchema),
	bounds: assetBoundsSchema,
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type StoredAsset = z.infer<typeof storedAssetSchema>;
export type AssetBounds = z.infer<typeof assetBoundsSchema>;

/**
 * Default asset categories
 */
export const ASSET_CATEGORIES = [
	"uncategorized",
	"patterns",
	"formations",
	"markers",
	"custom",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

/**
 * Migrate asset from older schema versions to current version
 * Returns null if migration is not possible
 */
export function migrateAsset(asset: unknown): StoredAsset | null {
	// Try to parse as current version
	const result = storedAssetSchema.safeParse(asset);
	if (result.success) {
		return result.data;
	}

	return null;
}
