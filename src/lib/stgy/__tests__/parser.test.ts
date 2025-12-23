import { describe, expect, it } from "vitest";
import { decodeStgy } from "../decoder";
import { parseBoardData } from "../parser";

describe("parser", () => {
	const sampleStgyString =
		"[stgy:a7AIxEt68bIksM7YvDMlkmKJL8iH2Eq-2vDUI+1PGMl9+UVD4FhAcsxS5tImN8GsSsHqSfbiqbA-P+yOUQ9unhordXjeMGL9gogzDY+BIgOtPiufNvO85+QJQtQ0HoGATs4AS6KNbAfZ0mBO0j7Xyr7DzEG8fCafOqcmj1p4mq-RTUxIVf5RqM+0GuS+XSB9CIBbHIKJoW3OvB8GEo0Z9+6TbKxdVBGwL5FY53igor8+TrbL7P2mEZwElDFDgDrmoxRYo-tH36+ipeUTp]";

	describe("parseBoardData", () => {
		it("should parse decoded binary data", () => {
			const binary = decodeStgy(sampleStgyString);
			const boardData = parseBoardData(binary);

			expect(boardData).toBeDefined();
			expect(boardData.version).toBe(2);
			expect(boardData.width).toBeGreaterThan(0);
			expect(boardData.height).toBeGreaterThan(0);
		});

		it("should parse board dimensions", () => {
			const binary = decodeStgy(sampleStgyString);
			const boardData = parseBoardData(binary);

			console.log("Board dimensions:", boardData.width, "x", boardData.height);
			console.log("Board name:", boardData.name);
			console.log("Background ID:", boardData.backgroundId);
			console.log("Object count:", boardData.objects.length);
		});

		it("should parse objects", () => {
			const binary = decodeStgy(sampleStgyString);
			const boardData = parseBoardData(binary);

			expect(Array.isArray(boardData.objects)).toBe(true);

			for (const obj of boardData.objects) {
				expect(obj.objectId).toBeDefined();
				expect(obj.position).toBeDefined();
				expect(obj.flags).toBeDefined();
				console.log(
					`Object ID: ${obj.objectId}, Position: (${obj.position.x}, ${obj.position.y}), Size: ${obj.size}, Rotation: ${obj.rotation}`,
				);
			}
		});
	});
});
