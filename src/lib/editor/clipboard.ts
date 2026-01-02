/**
 * システムクリップボード操作ユーティリティ
 * タブ間でのコピー/ペーストを可能にする
 */

import type { BoardObject } from "@/lib/stgy";

/** クリップボードデータの識別子 */
const CLIPBOARD_TYPE = "strategy-board-editor/objects";

/** クリップボードに保存するデータ形式 */
interface ClipboardData {
	type: typeof CLIPBOARD_TYPE;
	objects: BoardObject[];
}

/**
 * オブジェクトをシステムクリップボードにコピー
 */
export async function writeToClipboard(objects: BoardObject[]): Promise<void> {
	const data: ClipboardData = {
		type: CLIPBOARD_TYPE,
		objects: structuredClone(objects),
	};

	try {
		await navigator.clipboard.writeText(JSON.stringify(data));
	} catch (error) {
		console.error("Failed to write to clipboard:", error);
		throw error;
	}
}

/**
 * システムクリップボードからオブジェクトを読み取り
 * @returns オブジェクト配列、または読み取れない場合は null
 */
export async function readFromClipboard(): Promise<BoardObject[] | null> {
	try {
		const text = await navigator.clipboard.readText();
		if (!text) return null;

		const data = JSON.parse(text) as ClipboardData;

		// 識別子をチェック
		if (data.type !== CLIPBOARD_TYPE) {
			return null;
		}

		// オブジェクト配列をバリデート
		if (!Array.isArray(data.objects) || data.objects.length === 0) {
			return null;
		}

		return data.objects;
	} catch {
		// JSON解析失敗や他のアプリからのデータは無視
		return null;
	}
}
