/**
 * Parser intermediate state type definitions
 */

import type { BackgroundId, Color, ObjectFlags, Position } from "../types";

/**
 * Parser intermediate state
 */
export interface ParseContext {
	boardName: string;
	backgroundId: BackgroundId;
	objectIds: number[];
	texts: string[];
	flagsArray: ObjectFlags[];
	positions: Position[];
	rotations: number[];
	sizes: number[];
	colors: Color[];
	param1s: number[];
	param2s: number[];
	param3s: number[];
	sizePaddingByte: number | undefined;
	/** Empty field count at section content start (for round-trip) */
	emptyFieldCount: number;
}

/**
 * Create initial ParseContext
 */
export function createParseContext(): ParseContext {
	return {
		boardName: "",
		backgroundId: 1 as BackgroundId,
		objectIds: [],
		texts: [],
		flagsArray: [],
		positions: [],
		rotations: [],
		sizes: [],
		colors: [],
		param1s: [],
		param2s: [],
		param3s: [],
		sizePaddingByte: undefined,
		emptyFieldCount: 0,
	};
}
