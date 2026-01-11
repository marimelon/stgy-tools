/**
 * BoardData Zod schema (validation)
 * For importing from external JSON. id field is optional,
 * assigned by assignObjectIds after import.
 */
import { z } from "zod/v4";
import type { ParsedBoardData } from "./types";

const PositionSchema = z.object({
	x: z.number(),
	y: z.number(),
});

const ColorSchema = z.object({
	r: z.number().int().min(0).max(255),
	g: z.number().int().min(0).max(255),
	b: z.number().int().min(0).max(255),
	opacity: z.number().int().min(0).max(100),
});

const ObjectFlagsSchema = z.object({
	visible: z.boolean(),
	flipHorizontal: z.boolean(),
	flipVertical: z.boolean(),
	locked: z.boolean(),
});

/** Board object schema (without ID, for external input) */
const BoardObjectSchema = z
	.object({
		objectId: z.number().int().min(1),
		position: PositionSchema,
		rotation: z.number().min(-180).max(180),
		size: z.number().int().min(50).max(200),
		color: ColorSchema,
		flags: ObjectFlagsSchema,
		param1: z.number().optional(),
		param2: z.number().optional(),
		param3: z.number().optional(),
		text: z.string().optional(),
	})
	.passthrough();

const BoardDataSchema = z
	.object({
		version: z.number().int(),
		width: z.number().int().positive(),
		height: z.number().int().positive(),
		name: z.string(),
		backgroundId: z.number().int().min(0).max(7),
		objects: z.array(BoardObjectSchema),
	})
	.passthrough(); // preserve internal fields like _sizePaddingByte

export { BoardDataSchema, BoardObjectSchema };

/**
 * Parse and validate ParsedBoardData from JSON string
 * Returned object does not contain ID. Use assignObjectIds to assign IDs.
 */
export function safeParseBoardData(
	json: string,
):
	| { success: true; data: ParsedBoardData }
	| { success: false; errors: string[] } {
	try {
		const parsed: unknown = JSON.parse(json);
		const result = BoardDataSchema.safeParse(parsed);
		if (result.success) {
			return { success: true, data: result.data as ParsedBoardData };
		}
		return {
			success: false,
			errors: result.error.issues.map(
				(i) => `${i.path.join(".")}: ${i.message}`,
			),
		};
	} catch (e) {
		return {
			success: false,
			errors: [`JSON Parse Error: ${(e as Error).message}`],
		};
	}
}
