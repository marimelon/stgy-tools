/**
 * Download FFXIV assets from XIVAPI v2
 *
 * Usage:
 *   npx tsx scripts/setup-assets.ts
 *   npx tsx scripts/setup-assets.ts --force
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "public", "assets");

const XIVAPI_SHEET = "https://v2.xivapi.com/api/sheet";
const XIVAPI_ASSET = "https://v2.xivapi.com/api/asset";

interface SheetRow {
	row_id: number;
	fields: {
		Icon: {
			id: number;
			path: string;
			path_hr1: string;
		};
		Name: string;
	};
}

interface SheetResponse {
	rows: SheetRow[];
}

const force = process.argv.includes("--force");

async function downloadAsset(
	texturePath: string,
	outputPath: string,
): Promise<boolean> {
	if (!force && existsSync(outputPath)) {
		return false; // skipped
	}

	const url = `${XIVAPI_ASSET}?path=${encodeURIComponent(texturePath)}&format=png`;

	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);

		const buffer = await res.arrayBuffer();
		writeFileSync(outputPath, Buffer.from(buffer));
		return true;
	} catch {
		return false;
	}
}

async function downloadSheet(
	sheetName: string,
	outputDir: string,
	outputDirHr: string,
	label: string,
): Promise<{ success: number; skipped: number; failed: number }> {
	console.log(`\nDownloading ${label}...`);

	mkdirSync(outputDir, { recursive: true });
	mkdirSync(outputDirHr, { recursive: true });

	const res = await fetch(`${XIVAPI_SHEET}/${sheetName}?limit=200`);
	const data: SheetResponse = await res.json();

	let success = 0;
	let skipped = 0;
	let failed = 0;

	for (const row of data.rows) {
		const { row_id, fields } = row;
		const { Icon, Name } = fields;

		// Skip placeholder rows
		if (row_id === 0 || Icon.path === "ui/icon/000000/000000.tex") {
			continue;
		}

		// Download normal version
		const normalPath = join(outputDir, `${row_id}.png`);
		const normalResult = await downloadAsset(Icon.path, normalPath);

		// Download HR version
		const hrPath = join(outputDirHr, `${row_id}.png`);
		const hrResult = await downloadAsset(Icon.path_hr1, hrPath);

		if (normalResult || hrResult) {
			console.log(`  ✓ ${row_id} (${Name})`);
			success++;
		} else if (!force && existsSync(normalPath)) {
			skipped++;
		} else {
			console.log(`  ⚠ ${row_id} (${Name}) - failed`);
			failed++;
		}
	}

	return { success, skipped, failed };
}

async function main() {
	console.log("================================================");
	console.log("  FFXIV Strategy Board Asset Setup");
	console.log("================================================");
	console.log(`\nAPI: ${XIVAPI_SHEET}`);
	console.log(`Output: ${ASSETS_DIR}`);
	if (force) console.log("Mode: Force re-download");

	const iconStats = await downloadSheet(
		"TofuObject",
		join(ASSETS_DIR, "icons"),
		join(ASSETS_DIR, "icons-hr"),
		"TofuObject icons",
	);

	const bgStats = await downloadSheet(
		"TofuBg",
		join(ASSETS_DIR, "backgrounds"),
		join(ASSETS_DIR, "backgrounds-hr"),
		"TofuBg backgrounds",
	);

	console.log("\n================================================");
	console.log("Summary:");
	console.log(
		`  Icons:       ${iconStats.success} downloaded, ${iconStats.skipped} skipped, ${iconStats.failed} failed`,
	);
	console.log(
		`  Backgrounds: ${bgStats.success} downloaded, ${bgStats.skipped} skipped, ${bgStats.failed} failed`,
	);
	console.log("================================================");
}

main().catch(console.error);

