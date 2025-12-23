/**
 * セッション永続化のストレージ操作
 */

import { STORAGE_KEY, PERSISTENCE_VERSION, type SessionData } from "./types";
import type { ObjectGroup, GridSettings } from "@/lib/editor/types";
import { GRID_SIZES } from "@/lib/editor/types";

/**
 * セッションデータのバリデーション
 */
function validateSession(data: unknown): data is SessionData {
	if (typeof data !== "object" || data === null) {
		return false;
	}

	const d = data as Record<string, unknown>;

	// 必須フィールドの存在チェック
	if (typeof d.version !== "number") return false;
	if (typeof d.stgyCode !== "string" || d.stgyCode.length === 0) return false;
	if (typeof d.encodeKey !== "number" || d.encodeKey < 0 || d.encodeKey > 63)
		return false;
	if (!Array.isArray(d.groups)) return false;
	if (typeof d.gridSettings !== "object" || d.gridSettings === null)
		return false;
	if (typeof d.savedAt !== "string") return false;

	// gridSettingsのバリデーション
	const gs = d.gridSettings as Record<string, unknown>;
	if (typeof gs.enabled !== "boolean") return false;
	if (
		typeof gs.size !== "number" ||
		!GRID_SIZES.includes(gs.size as 8 | 16 | 32)
	)
		return false;
	if (typeof gs.showGrid !== "boolean") return false;

	// groupsの簡易バリデーション
	for (const group of d.groups as unknown[]) {
		if (typeof group !== "object" || group === null) return false;
		const g = group as Record<string, unknown>;
		if (typeof g.id !== "string") return false;
		if (!Array.isArray(g.objectIndices)) return false;
	}

	return true;
}

/**
 * localStorageからセッションを読み込み
 */
export function loadSession(): SessionData | null {
	if (typeof window === "undefined") {
		return null;
	}

	const saved = localStorage.getItem(STORAGE_KEY);
	if (!saved) {
		return null;
	}

	try {
		const parsed = JSON.parse(saved);

		// バージョンチェック
		if (parsed.version !== PERSISTENCE_VERSION) {
			// 将来のマイグレーション対応ポイント
			console.warn(
				`Session data version mismatch: expected ${PERSISTENCE_VERSION}, got ${parsed.version}`,
			);
			return null;
		}

		// バリデーション
		if (!validateSession(parsed)) {
			console.warn("Invalid session data structure");
			return null;
		}

		return parsed;
	} catch (error) {
		console.warn("Failed to parse session data:", error);
		return null;
	}
}

/**
 * セッションをlocalStorageに保存
 */
export function saveSession(data: SessionData): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (error) {
		// localStorageの容量制限などでエラーが発生する可能性
		console.error("Failed to save session:", error);
	}
}

/**
 * セッションデータをクリア
 */
export function clearSession(): void {
	if (typeof window === "undefined") {
		return;
	}

	localStorage.removeItem(STORAGE_KEY);
}

/**
 * セッションデータを作成
 */
export function createSessionData(
	stgyCode: string,
	encodeKey: number,
	groups: ObjectGroup[],
	gridSettings: GridSettings,
): SessionData {
	return {
		version: PERSISTENCE_VERSION,
		stgyCode,
		encodeKey,
		groups,
		gridSettings,
		savedAt: new Date().toISOString(),
	};
}

/**
 * セッションが存在するかチェック
 */
export function hasSession(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	return localStorage.getItem(STORAGE_KEY) !== null;
}
