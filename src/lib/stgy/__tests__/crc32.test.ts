import { describe, expect, it } from "vitest";
import { calculateCRC32 } from "../crc32";

describe("calculateCRC32", () => {
	it("should calculate CRC32 for known data", () => {
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const crc = calculateCRC32(data);
		expect(crc).toBeTypeOf("number");
		expect(crc).toBeGreaterThan(0);
	});

	it("should handle empty data", () => {
		const data = new Uint8Array([]);
		const crc = calculateCRC32(data);
		expect(crc).toBe(0);
	});

	it("should produce consistent results", () => {
		const data = new Uint8Array([10, 20, 30]);
		const crc1 = calculateCRC32(data);
		const crc2 = calculateCRC32(data);
		expect(crc1).toBe(crc2);
	});
});
