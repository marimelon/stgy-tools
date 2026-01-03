import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

/** サポートされている言語 */
export const SUPPORTED_LANGS = ["ja", "en"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/** デフォルト言語 */
export const DEFAULT_LANG: SupportedLang = "en";

const resources = {
	ja: { translation: ja },
	en: { translation: en },
};

/**
 * 言語コードがサポートされているか判定
 */
export function isSupportedLang(
	lang: string | undefined | null,
): lang is SupportedLang {
	return SUPPORTED_LANGS.includes(lang as SupportedLang);
}

/**
 * Accept-Languageヘッダーから優先言語を取得
 * @param acceptLanguage Accept-Languageヘッダーの値
 * @returns サポートされている言語、またはundefined
 */
export function parseAcceptLanguage(
	acceptLanguage: string | null | undefined,
): SupportedLang | undefined {
	if (!acceptLanguage) return undefined;

	// Accept-Language: ja,en-US;q=0.9,en;q=0.8 のような形式をパース
	const langs = acceptLanguage.split(",").map((part) => {
		const [lang] = part.trim().split(";");
		// "en-US" -> "en" のように言語コードのみ取得
		return lang.split("-")[0].toLowerCase();
	});

	// サポートされている言語で最初にマッチしたものを返す
	for (const lang of langs) {
		if (isSupportedLang(lang)) {
			return lang;
		}
	}

	return undefined;
}

/**
 * SSR用: 言語を決定する
 * 優先順位: URLパラメータ > Accept-Language > デフォルト
 */
export function resolveLanguageForSSR(
	langParam: string | undefined | null,
	acceptLanguage: string | undefined | null,
): SupportedLang {
	// 1. URLパラメータ
	if (isSupportedLang(langParam)) {
		return langParam;
	}

	// 2. Accept-Language
	const fromHeader = parseAcceptLanguage(acceptLanguage);
	if (fromHeader) {
		return fromHeader;
	}

	// 3. デフォルト
	return DEFAULT_LANG;
}

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: DEFAULT_LANG,
		supportedLngs: [...SUPPORTED_LANGS],
		interpolation: {
			escapeValue: false, // React already escapes values
		},
		detection: {
			// クライアント側: querystring > localStorage > navigator
			// SSRではquerystring以外は使えないが、beforeLoadでAccept-Languageを使用
			order: ["querystring", "localStorage", "navigator"],
			lookupQuerystring: "lang",
			lookupLocalStorage: "i18nextLng",
			caches: ["localStorage"],
		},
	});

export default i18n;
