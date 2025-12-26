import { describe, expect, it } from "vitest";
import { decryptCipher, encryptCipher } from "../cipher";

describe("cipher", () => {
	it("should encrypt/decrypt round-trip", () => {
		const input = "SGVsbG8gV29ybGQ"; // Base64 for "Hello World"
		const key = 42;
		const encrypted = encryptCipher(input, key);
		const decrypted = decryptCipher(encrypted, key);
		expect(decrypted).toBe(input);
	});

	it("should produce different output with different keys", () => {
		const input = "ABCDEFGH";
		const encrypted1 = encryptCipher(input, 10);
		const encrypted2 = encryptCipher(input, 20);
		expect(encrypted1).not.toBe(encrypted2);
	});

	it("should throw on invalid characters in decrypt", () => {
		expect(() => decryptCipher("Invalid@Chars!", 0)).toThrow(
			"Unknown character in payload",
		);
	});
});
