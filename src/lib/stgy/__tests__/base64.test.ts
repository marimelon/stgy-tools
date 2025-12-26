import { describe, expect, it } from "vitest";
import { decodeBase64, encodeBase64 } from "../base64";

describe("base64", () => {
	it("should encode/decode round-trip", () => {
		const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
		const encoded = encodeBase64(data);
		const decoded = decodeBase64(encoded);
		expect(decoded).toEqual(data);
	});

	it("should produce URL-safe characters", () => {
		const data = new Uint8Array([0xff, 0xfe, 0xfd]);
		const encoded = encodeBase64(data);
		expect(encoded).not.toContain("+");
		expect(encoded).not.toContain("/");
		expect(encoded).not.toContain("=");
	});

	it("should handle empty data", () => {
		const data = new Uint8Array([]);
		const encoded = encodeBase64(data);
		expect(encoded).toBe("");
		const decoded = decodeBase64(encoded);
		expect(decoded.length).toBe(0);
	});
});
