/**
 * 短縮リンク機能
 *
 * ストレージの抽象化により、KV以外のバックエンドにも対応可能
 */

import { getGlobalEnv } from "../cloudflareContext";
import {
	generateShortId,
	isValidShortId,
	isValidStgyCode,
} from "./idGenerator";
import { KVApiShortLinkStorage } from "./kvApiStorage";
import { type KVNamespace, KVShortLinkStorage } from "./kvStorage";
import { NullShortLinkStorage, type ShortLinkStorage } from "./storage";
import type {
	CreateShortLinkResponse,
	ShortLinkData,
	ShortLinkErrorCode,
} from "./types";

export type { ShortLinkStorage } from "./storage";
export type {
	CreateShortLinkResponse,
	ShortLinkData,
	ShortLinkErrorCode,
} from "./types";

/** 最大リトライ回数（ID衝突時） */
const MAX_RETRY_ATTEMPTS = 10;

/** ストレージインスタンスのキャッシュ */
let cachedStorage: ShortLinkStorage | null = null;
let cachedStorageKey: string | null = null;

/**
 * 短縮リンク機能が有効かどうかをチェック
 *
 * 環境変数 SHORT_LINKS_ENABLED が "true" の場合のみ有効
 */
export function isShortLinksEnabled(): boolean {
	const env = getGlobalEnv();
	return env?.SHORT_LINKS_ENABLED === "true";
}

/**
 * 現在の環境設定からキャッシュキーを生成
 */
function getStorageCacheKey(): string {
	const env = getGlobalEnv();
	return JSON.stringify({
		enabled: env?.SHORT_LINKS_ENABLED,
		kvBinding: Boolean(env?.SHORT_LINKS),
		accountId: env?.CLOUDFLARE_ACCOUNT_ID,
		namespaceId: env?.CLOUDFLARE_KV_NAMESPACE_ID,
		apiToken: env?.CLOUDFLARE_API_TOKEN ? "***" : undefined,
	});
}

/**
 * 現在の環境に応じたストレージを取得（シングルトン）
 *
 * 優先順位:
 * 1. Workers直接バインディング (SHORT_LINKS)
 * 2. KV REST API (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_KV_NAMESPACE_ID, CLOUDFLARE_API_TOKEN)
 * 3. Nullストレージ (ストレージ利用不可)
 */
export function getShortLinkStorage(): ShortLinkStorage {
	const cacheKey = getStorageCacheKey();
	if (cachedStorage && cachedStorageKey === cacheKey) {
		return cachedStorage;
	}

	const env = getGlobalEnv();
	let storage: ShortLinkStorage;

	if (!isShortLinksEnabled()) {
		storage = new NullShortLinkStorage();
	} else if (env?.SHORT_LINKS) {
		storage = new KVShortLinkStorage(env.SHORT_LINKS as KVNamespace);
	} else if (
		env?.CLOUDFLARE_ACCOUNT_ID &&
		env.CLOUDFLARE_KV_NAMESPACE_ID &&
		env.CLOUDFLARE_API_TOKEN
	) {
		storage = new KVApiShortLinkStorage({
			accountId: env.CLOUDFLARE_ACCOUNT_ID,
			namespaceId: env.CLOUDFLARE_KV_NAMESPACE_ID,
			apiToken: env.CLOUDFLARE_API_TOKEN,
		});
	} else {
		storage = new NullShortLinkStorage();
	}

	cachedStorage = storage;
	cachedStorageKey = cacheKey;
	return storage;
}

/**
 * 短縮IDからstgyコードを解決
 *
 * @param shortId 短縮ID
 * @returns stgyコード、または見つからない場合はnull
 */
export async function resolveShortId(
	shortId: string,
): Promise<ShortLinkData | null> {
	if (!isValidShortId(shortId)) {
		return null;
	}

	const storage = getShortLinkStorage();
	if (!storage.isAvailable()) {
		return null;
	}

	return storage.get(shortId);
}

/**
 * 短縮リンクを作成
 *
 * @param stgy stgyコード
 * @param baseUrl ベースURL（短縮URLの生成に使用）
 * @returns 作成結果
 * @throws エラー時は ShortLinkError をスロー
 */
export async function createShortLink(
	stgy: string,
	baseUrl: string,
): Promise<CreateShortLinkResponse> {
	const storage = getShortLinkStorage();

	if (!storage.isAvailable()) {
		const viewerUrl = `${baseUrl}/?stgy=${encodeURIComponent(stgy)}`;
		return { id: "", url: viewerUrl, viewerUrl, fallback: true };
	}

	if (!isValidStgyCode(stgy)) {
		throw new ShortLinkError("Invalid stgy code format", "INVALID_STGY");
	}

	let id: string | null = null;
	for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
		const candidateId = await generateShortId(stgy, attempt);
		const existing = await storage.get(candidateId);

		if (!existing) {
			await storage.save(candidateId, {
				stgy,
				createdAt: new Date().toISOString(),
			});
			id = candidateId;
			break;
		}

		if (existing.stgy === stgy) {
			id = candidateId;
			break;
		}
		// ハッシュ衝突 → リトライ
	}

	if (!id) {
		throw new ShortLinkError(
			"Failed to generate unique ID after max retries",
			"STORAGE_ERROR",
		);
	}

	const viewerUrl = `${baseUrl}/?stgy=${encodeURIComponent(stgy)}`;
	return {
		id,
		url: `${baseUrl}/?s=${id}`,
		viewerUrl,
	};
}

/**
 * 短縮リンク機能のカスタムエラー
 */
export class ShortLinkError extends Error {
	code: ShortLinkErrorCode;

	constructor(message: string, code: ShortLinkErrorCode) {
		super(message);
		this.name = "ShortLinkError";
		this.code = code;
	}
}
