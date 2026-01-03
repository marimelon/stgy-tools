/**
 * BoardData用Zodスキーマ（バリデーション）
 * 外部JSONからのインポート用。idフィールドはオプションで、
 * インポート後にassignObjectIdsで付与する想定。
 */
import { z } from "zod/v4";
import type { ParsedBoardData } from "./types";

/**
 * 座標スキーマ
 */
const PositionSchema = z.object({
	x: z.number(),
	y: z.number(),
});

/**
 * 色スキーマ
 */
const ColorSchema = z.object({
	r: z.number().int().min(0).max(255),
	g: z.number().int().min(0).max(255),
	b: z.number().int().min(0).max(255),
	opacity: z.number().int().min(0).max(100),
});

/**
 * オブジェクトフラグスキーマ
 */
const ObjectFlagsSchema = z.object({
	visible: z.boolean(),
	flipHorizontal: z.boolean(),
	flipVertical: z.boolean(),
	locked: z.boolean(),
});

/**
 * ボードオブジェクトスキーマ（IDなし、外部入力用）
 */
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

/**
 * ボードデータスキーマ
 */
const BoardDataSchema = z
	.object({
		version: z.number().int(),
		width: z.number().int().positive(),
		height: z.number().int().positive(),
		name: z.string(),
		backgroundId: z.number().int().min(0).max(7),
		objects: z.array(BoardObjectSchema),
	})
	.passthrough(); // _sizePaddingByte等の内部フィールドを保持

export { BoardDataSchema, BoardObjectSchema };

/**
 * JSON文字列からParsedBoardDataをパースしてバリデーション
 * 戻り値のオブジェクトにはIDが含まれない。assignObjectIdsでIDを付与する。
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
