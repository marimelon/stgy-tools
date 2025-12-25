/**
 * 短縮リンクストレージの抽象インターフェース
 *
 * KV、Firestore、R2など様々なバックエンドに対応できるよう抽象化
 */

import type { ShortLinkData } from "./types";

/**
 * 短縮リンクストレージのインターフェース
 *
 * 実装例:
 * - KVShortLinkStorage: Cloudflare KV
 * - FirestoreShortLinkStorage: Google Firestore
 * - MemoryShortLinkStorage: インメモリ（テスト用）
 */
export interface ShortLinkStorage {
	/**
	 * 短縮IDからデータを取得
	 * @param id 短縮ID
	 * @returns データ、または見つからない場合はnull
	 */
	get(id: string): Promise<ShortLinkData | null>;

	/**
	 * 短縮リンクを保存
	 * @param id 短縮ID
	 * @param data 保存するデータ
	 */
	save(id: string, data: ShortLinkData): Promise<void>;

	/**
	 * 短縮IDが存在するかチェック
	 * @param id 短縮ID
	 * @returns 存在すればtrue
	 */
	exists(id: string): Promise<boolean>;

	/**
	 * ストレージが利用可能かどうか
	 * @returns 利用可能ならtrue
	 */
	isAvailable(): boolean;
}

/**
 * ストレージが利用不可能な場合のフォールバック実装
 * 常にnullを返し、保存も何もしない
 */
export class NullShortLinkStorage implements ShortLinkStorage {
	async get(_id: string): Promise<ShortLinkData | null> {
		return null;
	}

	async save(_id: string, _data: ShortLinkData): Promise<void> {
		// 何もしない
	}

	async exists(_id: string): Promise<boolean> {
		return false;
	}

	isAvailable(): boolean {
		return false;
	}
}
