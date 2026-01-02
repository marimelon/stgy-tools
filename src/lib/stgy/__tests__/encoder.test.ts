import { describe, expect, it } from "vitest";
import { MAX_BOARD_NAME_LENGTH } from "../constants";
import { decodeStgy } from "../decoder";
import { encodeStgy } from "../encoder";
import { parseBoardData } from "../parser";
import { serializeBoardData } from "../serializer";
import { ALPHABET_TABLE } from "../tables";
import type { BoardData } from "../types";
import { BackgroundId } from "../types";

const SAMPLE_STGY =
	"[stgy:a7AIxEt68bIksM7YvDMlkmKJL8iH2Eq-2vDUI+1PGMl9+UVD4FhAcsxS5tImN8GsSsHqSfbiqbA-P+yOUQ9unhordXjeMGL9gogzDY+BIgOtPiufNvO85+QJQtQ0HoGATs4AS6KNbAfZ0mBO0j7Xyr7DzEG8fCafOqcmj1p4mq-RTUxIVf5RqM+0GuS+XSB9CIBbHIKJoW3OvB8GEo0Z9+6TbKxdVBGwL5FY53igor8+TrbL7P2mEZwElDFDgDrmoxRYo-tH36+ipeUTp]";

describe("encoder", () => {
	it("should round-trip a simple board", () => {
		const testBoard: BoardData = {
			version: 2,
			name: "Test",
			backgroundId: BackgroundId.None,
			objects: [
				{
					objectId: 47, // Tank
					flags: {
						visible: true,
						flipHorizontal: false,
						flipVertical: false,
						locked: false,
					},
					position: { x: 100, y: 100 },
					rotation: 0,
					size: 100,
					color: { r: 255, g: 100, b: 0, opacity: 0 },
				},
			],
		};

		// Encode
		const encoded = encodeStgy(testBoard);
		console.log("Encoded:", encoded);

		// Decode
		const decoded = decodeStgy(encoded);
		console.log("Decoded binary length:", decoded.length);

		// Parse
		const parsed = parseBoardData(decoded);
		console.log("Parsed:", JSON.stringify(parsed, null, 2));

		// Verify
		expect(parsed.version).toBe(testBoard.version);
		expect(parsed.name).toBe(testBoard.name);
		expect(parsed.objects.length).toBe(testBoard.objects.length);
	});

	it("should serialize and deserialize binary correctly", () => {
		const testBoard: BoardData = {
			version: 2,
			name: "Test",
			backgroundId: BackgroundId.None,
			objects: [],
		};

		const binary = serializeBoardData(testBoard);
		console.log("Binary length:", binary.length);
		console.log(
			"Binary header:",
			Array.from(binary.slice(0, 24))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join(" "),
		);

		const parsed = parseBoardData(binary);
		expect(parsed.version).toBe(2);
		expect(parsed.name).toBe("Test");
	});

	it("should round-trip existing sample stgy", () => {
		// Decode original
		const originalBinary = decodeStgy(SAMPLE_STGY);
		const originalBoard = parseBoardData(originalBinary);
		console.log("Original board name:", originalBoard.name);
		console.log("Original object count:", originalBoard.objects.length);

		// Re-encode
		const reEncoded = encodeStgy(originalBoard);
		console.log("Re-encoded:", `${reEncoded.substring(0, 50)}...`);

		// Decode again
		const decodedBinary = decodeStgy(reEncoded);
		const decodedBoard = parseBoardData(decodedBinary);
		console.log("Decoded board name:", decodedBoard.name);
		console.log("Decoded object count:", decodedBoard.objects.length);

		// Verify
		expect(decodedBoard.name).toBe(originalBoard.name);
		expect(decodedBoard.objects.length).toBe(originalBoard.objects.length);
		expect(decodedBoard.backgroundId).toBe(originalBoard.backgroundId);
	});

	it("should have correct reverse alphabet table", () => {
		// Build reverse table
		const reverseTable: Record<string, string> = {};
		for (const [k, v] of Object.entries(ALPHABET_TABLE)) {
			reverseTable[v as string] = k;
		}

		// Test a few values
		expect(reverseTable.A).toBe("f"); // A -> f
		expect(reverseTable["0"]).toBe("2"); // 0 -> 2
		expect(reverseTable["-"]).toBe("b"); // - -> b

		// Test all 64 base64 characters are present
		const base64Chars =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
		for (const char of base64Chars) {
			expect(reverseTable[char]).toBeDefined();
		}
		console.log("All 64 base64 characters have mappings");
	});

	it("should produce output with valid characters only", () => {
		// Get valid encoded characters (keys of ALPHABET_TABLE)
		const validChars = new Set(Object.keys(ALPHABET_TABLE));

		const testBoard: BoardData = {
			version: 2,
			name: "Test",
			backgroundId: BackgroundId.None,
			objects: [
				{
					objectId: 47,
					flags: {
						visible: true,
						flipHorizontal: false,
						flipVertical: false,
						locked: false,
					},
					position: { x: 100, y: 100 },
					rotation: 0,
					size: 100,
					color: { r: 255, g: 100, b: 0, opacity: 0 },
				},
			],
		};

		const encoded = encodeStgy(testBoard);
		// Remove prefix [stgy:a and suffix ]
		const payload = encoded.slice(8, -1);

		// Check each character in the payload
		const invalidChars: string[] = [];
		for (const char of payload) {
			if (!validChars.has(char)) {
				invalidChars.push(char);
			}
		}

		if (invalidChars.length > 0) {
			console.log("Invalid characters found:", invalidChars);
		}
		expect(invalidChars.length).toBe(0);
	});

	it("should encode and decode empty board", () => {
		const emptyBoard: BoardData = {
			version: 2,
			name: "",
			backgroundId: BackgroundId.None,
			objects: [],
		};

		const encoded = encodeStgy(emptyBoard);
		console.log("Empty board encoded:", encoded);

		const decoded = decodeStgy(encoded);
		const parsed = parseBoardData(decoded);

		expect(parsed.version).toBe(2);
		expect(parsed.objects.length).toBe(0);
	});

	it("should compare serialized binary with original", () => {
		// Decode original to get the binary
		const originalBinary = decodeStgy(SAMPLE_STGY);
		console.log("Original binary length:", originalBinary.length);
		console.log(
			"Original binary header:",
			Array.from(originalBinary.slice(0, 40))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join(" "),
		);

		// Parse and re-serialize
		const board = parseBoardData(originalBinary);
		const serialized = serializeBoardData(board);
		console.log("Serialized binary length:", serialized.length);
		console.log(
			"Serialized binary header:",
			Array.from(serialized.slice(0, 40))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join(" "),
		);

		// Check if they match
		const minLength = Math.min(originalBinary.length, serialized.length);
		let firstDiff = -1;
		for (let i = 0; i < minLength; i++) {
			if (originalBinary[i] !== serialized[i]) {
				firstDiff = i;
				break;
			}
		}
		if (firstDiff >= 0) {
			console.log(`First difference at byte ${firstDiff}`);
			console.log(`  Original: ${originalBinary[firstDiff].toString(16)}`);
			console.log(`  Serialized: ${serialized[firstDiff].toString(16)}`);
		}
	});

	describe("board name length", () => {
		it("should have MAX_BOARD_NAME_LENGTH set to 20", () => {
			expect(MAX_BOARD_NAME_LENGTH).toBe(20);
		});

		it("should round-trip board name at max length (20 characters)", () => {
			const maxLengthName = "A".repeat(MAX_BOARD_NAME_LENGTH);
			expect(maxLengthName.length).toBe(20);

			const board: BoardData = {
				version: 2,
				name: maxLengthName,
				backgroundId: BackgroundId.None,
				objects: [],
			};

			const encoded = encodeStgy(board);
			const decoded = decodeStgy(encoded);
			const parsed = parseBoardData(decoded);

			expect(parsed.name).toBe(maxLengthName);
		});

		it("should round-trip board name exceeding max length (debug mode)", () => {
			// debugMode では20文字を超えるボード名も許可される
			const longName = "A".repeat(30);
			expect(longName.length).toBe(30);

			const board: BoardData = {
				version: 2,
				name: longName,
				backgroundId: BackgroundId.None,
				objects: [],
			};

			const encoded = encodeStgy(board);
			const decoded = decodeStgy(encoded);
			const parsed = parseBoardData(decoded);

			expect(parsed.name).toBe(longName);
		});

		it("should round-trip Japanese board name at max length", () => {
			// 日本語20文字（バイト数では60バイト以上になる）
			const japaneseName = "あ".repeat(MAX_BOARD_NAME_LENGTH);
			expect(japaneseName.length).toBe(20);

			const board: BoardData = {
				version: 2,
				name: japaneseName,
				backgroundId: BackgroundId.None,
				objects: [],
			};

			const encoded = encodeStgy(board);
			const decoded = decodeStgy(encoded);
			const parsed = parseBoardData(decoded);

			expect(parsed.name).toBe(japaneseName);
		});

		it("should round-trip mixed Japanese/ASCII board name", () => {
			const mixedName = "テスト Board 日本語";
			expect(mixedName.length).toBeLessThanOrEqual(MAX_BOARD_NAME_LENGTH);

			const board: BoardData = {
				version: 2,
				name: mixedName,
				backgroundId: BackgroundId.None,
				objects: [],
			};

			const encoded = encodeStgy(board);
			const decoded = decodeStgy(encoded);
			const parsed = parseBoardData(decoded);

			expect(parsed.name).toBe(mixedName);
		});
	});

	describe("Line object params", () => {
		it("should round-trip Line object with param1, param2, param3", () => {
			const board: BoardData = {
				version: 2,
				name: "Line Test",
				backgroundId: BackgroundId.None,
				objects: [
					{
						objectId: 12, // Line
						flags: {
							visible: true,
							flipHorizontal: false,
							flipVertical: false,
							locked: false,
						},
						position: { x: 128, y: 192 },
						rotation: 0,
						size: 100,
						color: { r: 255, g: 255, b: 255, opacity: 0 },
						param1: 3840, // 終点X * 10 = 384 * 10
						param2: 1920, // 終点Y * 10 = 192 * 10
						param3: 6, // 線幅
					},
				],
			};

			const encoded = encodeStgy(board);
			const decoded = decodeStgy(encoded);
			const parsed = parseBoardData(decoded);

			expect(parsed.objects.length).toBe(1);
			const lineObj = parsed.objects[0];
			expect(lineObj.objectId).toBe(12);
			expect(lineObj.param1).toBe(3840);
			expect(lineObj.param2).toBe(1920);
			expect(lineObj.param3).toBe(6);
		});

		it("should preserve param3 when other params are updated", () => {
			const board: BoardData = {
				version: 2,
				name: "Line Test",
				backgroundId: BackgroundId.None,
				objects: [
					{
						objectId: 12,
						flags: {
							visible: true,
							flipHorizontal: false,
							flipVertical: false,
							locked: false,
						},
						position: { x: 100, y: 100 },
						rotation: 45,
						size: 100,
						color: { r: 255, g: 255, b: 255, opacity: 0 },
						param1: 2000,
						param2: 1500,
						param3: 8, // カスタム線幅
					},
				],
			};

			const encoded = encodeStgy(board);
			const decoded = decodeStgy(encoded);
			const parsed = parseBoardData(decoded);

			expect(parsed.objects[0].param3).toBe(8);
		});
	});
});
