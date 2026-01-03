/**
 * サーバー専用の言語判定ユーティリティ
 * このファイルはサーバーサイドでのみ使用される
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import {
	DEFAULT_LANG,
	isSupportedLang,
	parseAcceptLanguage,
	type SupportedLang,
} from "./index";

/**
 * サーバー関数: Accept-Languageヘッダーから言語を取得
 */
export const getAcceptLanguage = createServerFn().handler(async () => {
	const acceptLanguage = getRequestHeader("accept-language");
	return parseAcceptLanguage(acceptLanguage);
});

/**
 * サーバー関数: 言語を決定する
 * URLパラメータがない場合にAccept-Languageから言語を取得
 */
export const resolveLanguageServer = createServerFn({
	method: "GET",
}).handler(async (): Promise<SupportedLang> => {
	// リクエストオブジェクトを取得
	const request = getRequest();

	// URLからlangパラメータを取得
	const url = new URL(request.url);
	const langParam = url.searchParams.get("lang");

	// URLパラメータが有効な場合はそれを使用
	if (isSupportedLang(langParam)) {
		return langParam;
	}

	// Accept-Languageヘッダーから取得
	const acceptLanguage = getRequestHeader("accept-language");
	const fromHeader = parseAcceptLanguage(acceptLanguage);
	if (fromHeader) {
		return fromHeader;
	}

	// デフォルト
	return DEFAULT_LANG;
});
