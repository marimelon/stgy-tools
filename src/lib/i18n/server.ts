/**
 * Server-only language resolution utilities
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import {
	DEFAULT_LANG,
	isSupportedLang,
	parseAcceptLanguage,
	type SupportedLang,
} from "./index";

export const getAcceptLanguage = createServerFn().handler(async () => {
	const acceptLanguage = getRequestHeader("accept-language");
	return parseAcceptLanguage(acceptLanguage);
});

/**
 * Resolve language on server (URL param > Accept-Language > default)
 */
export const resolveLanguageServer = createServerFn({
	method: "GET",
}).handler(async (): Promise<SupportedLang> => {
	const request = getRequest();

	const url = new URL(request.url);
	const langParam = url.searchParams.get("lang");

	if (isSupportedLang(langParam)) {
		return langParam;
	}

	const acceptLanguage = getRequestHeader("accept-language");
	const fromHeader = parseAcceptLanguage(acceptLanguage);
	if (fromHeader) {
		return fromHeader;
	}

	return DEFAULT_LANG;
});
