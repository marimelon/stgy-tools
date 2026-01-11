import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

export const SUPPORTED_LANGS = ["ja", "en"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = "en";

const resources = {
	ja: { translation: ja },
	en: { translation: en },
};

export function isSupportedLang(
	lang: string | undefined | null,
): lang is SupportedLang {
	return SUPPORTED_LANGS.includes(lang as SupportedLang);
}

/**
 * Parse Accept-Language header to get preferred language
 */
export function parseAcceptLanguage(
	acceptLanguage: string | null | undefined,
): SupportedLang | undefined {
	if (!acceptLanguage) return undefined;

	// Parse "ja,en-US;q=0.9,en;q=0.8" format, extract language codes
	const langs = acceptLanguage.split(",").map((part) => {
		const [lang] = part.trim().split(";");
		return lang.split("-")[0].toLowerCase();
	});

	for (const lang of langs) {
		if (isSupportedLang(lang)) {
			return lang;
		}
	}

	return undefined;
}

/**
 * Resolve language for SSR (URL param > Accept-Language > default)
 */
export function resolveLanguageForSSR(
	langParam: string | undefined | null,
	acceptLanguage: string | undefined | null,
): SupportedLang {
	if (isSupportedLang(langParam)) {
		return langParam;
	}

	const fromHeader = parseAcceptLanguage(acceptLanguage);
	if (fromHeader) {
		return fromHeader;
	}

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
			order: ["querystring", "localStorage", "navigator"],
			lookupQuerystring: "lang",
			lookupLocalStorage: "i18nextLng",
			caches: ["localStorage"],
		},
	});

export default i18n;
