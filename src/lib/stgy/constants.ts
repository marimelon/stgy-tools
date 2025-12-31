/**
 * STGY形式の共通定数
 */

// ===== STGY文字列フォーマット =====
export const STGY_PREFIX = "[stgy:a";
export const STGY_SUFFIX = "]";
export const KEY_CHAR_INDEX = 7; // STGY_PREFIX.length

// ===== バイナリレイアウト =====
export const CRC32_SIZE = 4;
export const DECOMPRESSED_LENGTH_SIZE = 2;
export const BINARY_HEADER_SIZE = CRC32_SIZE + DECOMPRESSED_LENGTH_SIZE; // 6
export const COMPRESSED_DATA_OFFSET = BINARY_HEADER_SIZE;

// ===== 最小長検証 =====
export const MIN_STGY_PAYLOAD_LENGTH = 2;

// ===== フィールドID =====
export const FieldIds = {
	BOARD_NAME: 1,
	OBJECT_ID: 2,
	TEXT_TERMINATOR: 3,
	FLAGS: 4,
	POSITIONS: 5,
	ROTATIONS: 6,
	SIZES: 7,
	COLORS: 8,
	PARAM_1: 10,
	PARAM_2: 11,
	PARAM_3: 12,
} as const;

export type FieldId = (typeof FieldIds)[keyof typeof FieldIds];

// ===== フラグビット =====
export const FlagBits = {
	VISIBLE: 0x01,
	FLIP_HORIZONTAL: 0x02,
	FLIP_VERTICAL: 0x04,
	LOCKED: 0x08,
} as const;

// ===== アライメント =====
export const BYTE_ALIGNMENT_4 = 4;
export const BYTE_ALIGNMENT_2 = 2;

// ===== 座標スケール =====
export const COORDINATE_SCALE = 10;

// ===== 暗号化 =====
export const KEY_MASK = 0x3f; // 63
export const MAX_CIPHER_KEY = 63;
export const CIPHER_KEY_RANGE = 64;

// ===== CRC32 =====
export const CRC32_POLYNOMIAL = 0xedb88320;
export const CRC32_INITIAL_VALUE = 0xffffffff;
export const CRC32_FINAL_XOR = 0xffffffff;

// ===== テキストオブジェクト =====
export const TEXT_OBJECT_ID = 100;
export const MAX_TEXT_BYTES = 30;
