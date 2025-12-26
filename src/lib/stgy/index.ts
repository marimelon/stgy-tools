// Constants

export type { FieldId } from "./constants";
export {
	BYTE_ALIGNMENT_2,
	BYTE_ALIGNMENT_4,
	CIPHER_KEY_RANGE,
	COORDINATE_SCALE,
	CRC32_FINAL_XOR,
	CRC32_INITIAL_VALUE,
	CRC32_POLYNOMIAL,
	FieldIds,
	FlagBits,
	KEY_CHAR_INDEX,
	KEY_MASK,
	MAX_CIPHER_KEY,
	MIN_STGY_PAYLOAD_LENGTH,
	STGY_PREFIX,
	STGY_SUFFIX,
	TEXT_OBJECT_ID,
} from "./constants";
export type { CompareResult, DecodeDebugInfo, FieldInfo } from "./debug";
// Debug utilities
export { compareStgy, decodeStgyDebug, hexDump } from "./debug";
export type { DecodeResult } from "./decoder";
export { decodeStgy, decodeStgyWithInfo } from "./decoder";
export type { EncodeOptions } from "./encoder";
export { encodeStgy, extractKeyFromStgy } from "./encoder";
export { parseBoardData } from "./parser";
export { serializeBoardData } from "./serializer";
export type {
	BoardData,
	BoardObject,
	Color,
	EditParamDefinition,
	ObjectFlags,
	Position,
} from "./types";
export {
	BackgroundId,
	DEFAULT_EDIT_PARAMS,
	DEFAULT_FLIP_FLAGS,
	DISABLED_OBJECT_IDS,
	EDIT_PARAMS,
	EditParamIds,
	MAX_TOTAL_OBJECTS,
	OBJECT_EDIT_PARAMS,
	OBJECT_FLIP_FLAGS,
	OBJECT_LIMITS,
	ObjectIds,
	ObjectNames,
} from "./types";
// Utils
export { getPadding2, getPadding4, padTo2Bytes, padTo4Bytes } from "./utils";
