/**
 * Feature Flags - サーバーサイドの機能フラグ管理
 *
 * 環境変数に基づいて機能の有効/無効を制御し、
 * クライアントサイドで利用可能な形式で提供する
 */

import { createServerFn } from "@tanstack/react-start";

/**
 * Feature Flags の型定義
 */
export interface FeatureFlags {
	/** 短縮URL機能が有効かどうか */
	shortLinksEnabled: boolean;
}

/**
 * Feature Flags を取得するサーバー関数
 *
 * クライアントサイドからルートのloaderで呼び出して使用する
 * 動的インポートを使用してサーバー専用モジュールをクライアントバンドルから除外
 */
export const getFeatureFlagsFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<FeatureFlags> => {
		// 動的インポートでサーバー専用モジュールをロード
		const { isShortLinksEnabled } = await import("./shortLinks");
		return {
			shortLinksEnabled: isShortLinksEnabled(),
		};
	},
);
