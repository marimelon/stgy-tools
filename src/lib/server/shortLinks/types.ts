/**
 * 短縮リンク機能の型定義
 */

/**
 * 短縮リンクのデータ
 */
export interface ShortLinkData {
	/** stgyコード */
	stgy: string;
	/** 作成日時（ISO 8601） */
	createdAt: string;
	/** アクセス回数（オプション、ストレージによっては未対応） */
	accessCount?: number;
}

/**
 * 短縮リンク作成リクエスト
 */
export interface CreateShortLinkRequest {
	/** stgyコード */
	stgy: string;
}

/**
 * 短縮リンク作成レスポンス
 */
export interface CreateShortLinkResponse {
	/** 短縮ID */
	id: string;
	/** 完全な短縮URL */
	url: string;
	/** ビューワーURL（フォールバック用） */
	viewerUrl: string;
	/** フォールバックモードかどうか */
	fallback?: boolean;
}

/**
 * エラーレスポンス
 */
export interface ShortLinkErrorResponse {
	error: string;
	code: ShortLinkErrorCode;
}

/**
 * エラーコード
 */
export type ShortLinkErrorCode =
	| "INVALID_STGY"
	| "RATE_LIMITED"
	| "STORAGE_ERROR"
	| "NOT_FOUND"
	| "STORAGE_UNAVAILABLE";
