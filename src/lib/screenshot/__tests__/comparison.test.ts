/**
 * Screenshot comparison tests
 *
 * Compare in-game screenshots with rendered stgy code results,
 * verifying the match percentage exceeds the threshold.
 *
 * Test data in __fixtures__/ directory:
 *   001.png + 001.txt
 *   002.png + 002.txt
 *   ...
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderImage } from "@/lib/server/imageRenderer";
import { assignBoardObjectIds, decodeStgy, parseBoardData } from "@/lib/stgy";
import { TARGET_BOARD_HEIGHT, TARGET_BOARD_WIDTH } from "../types";
import {
	comparePixels,
	detectBoardRegion,
	extractRegion,
	parsePng,
	resizePng,
} from "./testUtils";

const MATCH_THRESHOLD = 95;

const FIXTURES_DIR = resolve(import.meta.dirname, "./__fixtures__");

/**
 * Discover all test cases from fixtures directory
 */
function discoverTestCases(): Array<{
	id: string;
	pngPath: string;
	txtPath: string;
}> {
	const files = readdirSync(FIXTURES_DIR);
	const pngFiles = files.filter((f) => f.endsWith(".png"));

	const testCases: Array<{ id: string; pngPath: string; txtPath: string }> = [];

	for (const pngFile of pngFiles) {
		const id = pngFile.replace(".png", "");
		const txtFile = `${id}.txt`;

		if (files.includes(txtFile)) {
			testCases.push({
				id,
				pngPath: resolve(FIXTURES_DIR, pngFile),
				txtPath: resolve(FIXTURES_DIR, txtFile),
			});
		}
	}

	testCases.sort((a, b) =>
		a.id.localeCompare(b.id, undefined, { numeric: true }),
	);

	return testCases;
}

async function runComparison(
	pngPath: string,
	txtPath: string,
): Promise<{
	matchPercentage: number;
	diffPixelCount: number;
	totalPixels: number;
}> {
	const screenshotBuffer = readFileSync(pngPath);
	const screenshotPng = parsePng(screenshotBuffer);

	const stgyCode = readFileSync(txtPath, "utf-8").trim();
	if (!/^\[stgy:a[^\]]+\]$/.test(stgyCode)) {
		throw new Error(`Invalid stgy code format in ${txtPath}`);
	}

	const decoded = decodeStgy(stgyCode);
	if (decoded === null) {
		throw new Error(`Failed to decode stgy code from ${txtPath}`);
	}
	const parsed = parseBoardData(decoded);
	if (parsed === null) {
		throw new Error(`Failed to parse board data from ${txtPath}`);
	}
	const boardData = assignBoardObjectIds(parsed);

	const renderResult = await renderImage({
		boardData,
		format: "png",
		width: TARGET_BOARD_WIDTH,
		showTitle: false,
		stgyCode,
	});

	const renderedPng = parsePng(Buffer.from(renderResult.data));

	const detectedRegion = detectBoardRegion(screenshotPng);
	if (detectedRegion === null) {
		throw new Error(`Failed to detect board region in ${pngPath}`);
	}

	const extractedPng = extractRegion(screenshotPng, detectedRegion);
	const resizedPng = resizePng(
		extractedPng,
		TARGET_BOARD_WIDTH,
		TARGET_BOARD_HEIGHT,
	);

	return comparePixels(resizedPng, renderedPng, 0.1);
}

const testCases = discoverTestCases();

describe("Screenshot Comparison", () => {
	if (testCases.length === 0) {
		it.skip("No test fixtures found", () => {});
	} else {
		for (const testCase of testCases) {
			it(`[${testCase.id}] should match screenshot with rendered stgy code`, async () => {
				const result = await runComparison(testCase.pngPath, testCase.txtPath);

				console.log(
					`[${testCase.id}] Match Rate: ${result.matchPercentage.toFixed(2)}% ` +
						`(Diff: ${result.diffPixelCount}/${result.totalPixels})`,
				);

				expect(result.matchPercentage).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
			});
		}

		it("should have all test cases pass threshold", async () => {
			const results: Array<{ id: string; matchPercentage: number }> = [];

			for (const testCase of testCases) {
				const result = await runComparison(testCase.pngPath, testCase.txtPath);
				results.push({
					id: testCase.id,
					matchPercentage: result.matchPercentage,
				});
			}

			const percentages = results.map((r) => r.matchPercentage);
			const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
			const min = Math.min(...percentages);
			const max = Math.max(...percentages);

			console.log("\n=== Summary ===");
			console.log(`Total: ${results.length} test cases`);
			console.log(`Average: ${avg.toFixed(2)}%`);
			console.log(`Min: ${min.toFixed(2)}%`);
			console.log(`Max: ${max.toFixed(2)}%`);

			const failed = results.filter((r) => r.matchPercentage < MATCH_THRESHOLD);
			if (failed.length > 0) {
				console.log(`\nFailed (< ${MATCH_THRESHOLD}%):`);
				for (const f of failed) {
					console.log(`  [${f.id}] ${f.matchPercentage.toFixed(2)}%`);
				}
			}

			expect(failed.length).toBe(0);
		});
	}
});
