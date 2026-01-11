/**
 * SEO utilities
 */

export const SITE_CONFIG = {
	name: "STGY Tools",
	description:
		"View and edit FFXIV Strategy Boards. Decode and create stgy codes for raid strategy diagrams.",
	descriptionJa:
		"FFXIV ストラテジーボードを表示・編集するツール。stgyコードの読み込み・作成に対応。",
	url: "https://stgy.m4e.dev",
	locale: {
		default: "en",
		supported: ["ja", "en"] as const,
	},
} as const;

export const PAGE_SEO = {
	home: {
		title: "STGY Tools - FFXIV Strategy Board Viewer",
		titleJa: "STGY Tools - FFXIV ストラテジーボード Viewer",
		description:
			"View and decode FFXIV Strategy Board (stgy) codes. Display raid strategies with interactive visualization.",
		descriptionJa:
			"FFXIV ストラテジーボードのstgyコードを表示・読み込み。レイド攻略図を見やすく表示します。",
		path: "/",
	},
	editor: {
		title: "Strategy Board Editor | STGY Tools",
		titleJa: "ストラテジーボード Editor | STGY Tools",
		description:
			"Create and edit FFXIV Strategy Board diagrams. Full-featured editor with layers, groups, and stgy code export.",
		descriptionJa:
			"FFXIV ストラテジーボードを作成・編集。レイヤーやグループ機能を備えた多機能エディター。",
		path: "/editor",
	},
	imageGenerator: {
		title: "FFXIV Strategy Board Image Generator | STGY Tools",
		titleJa: "FFXIV ストラテジーボード Image Generator | STGY Tools",
		description:
			"Generate shareable images from FFXIV Strategy Board codes. Export as PNG or SVG for Discord, Twitter, and more.",
		descriptionJa:
			"FFXIV ストラテジーボードのコードから画像を生成。DiscordやTwitterで共有できるPNG/SVG形式で出力。",
		path: "/image/generate",
	},
} as const;

export const OGP_DEFAULTS = {
	type: "website",
	siteName: "STGY Tools",
	image: "/favicon.svg",
	imageWidth: "512",
	imageHeight: "384",
} as const;

export function generateWebApplicationSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: SITE_CONFIG.name,
		description: SITE_CONFIG.description,
		url: SITE_CONFIG.url,
		applicationCategory: "UtilityApplication",
		operatingSystem: "Any",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		author: {
			"@type": "Person",
			name: "marime",
			url: "https://github.com/marimelon",
		},
	};
}

export function generateBreadcrumbSchema(
	items: Array<{ name: string; url: string }>,
) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: item.url,
		})),
	};
}

export function generateHreflangLinks(path: string) {
	return [
		{
			rel: "alternate",
			hrefLang: "ja",
			href: `${SITE_CONFIG.url}${path}?lang=ja`,
		},
		{
			rel: "alternate",
			hrefLang: "en",
			href: `${SITE_CONFIG.url}${path}?lang=en`,
		},
		{
			rel: "alternate",
			hrefLang: "x-default",
			href: `${SITE_CONFIG.url}${path}`,
		},
	];
}

export function generateCanonicalLink(path: string, lang?: string | null) {
	const supportedLangs = SITE_CONFIG.locale.supported;
	const isValidLang =
		lang && supportedLangs.includes(lang as (typeof supportedLangs)[number]);
	const href = isValidLang
		? `${SITE_CONFIG.url}${path}?lang=${lang}`
		: `${SITE_CONFIG.url}${path}`;
	return {
		rel: "canonical",
		href,
	};
}

export function generateCommonMeta(
	page: keyof typeof PAGE_SEO,
	lang?: string | null,
) {
	const seo = PAGE_SEO[page];
	return {
		meta: [
			{ title: seo.title },
			{ name: "description", content: seo.description },
			// OGP
			{ property: "og:title", content: seo.title },
			{ property: "og:description", content: seo.description },
			{ property: "og:type", content: OGP_DEFAULTS.type },
			{ property: "og:site_name", content: OGP_DEFAULTS.siteName },
			{
				property: "og:image",
				content: `${SITE_CONFIG.url}${OGP_DEFAULTS.image}`,
			},
			{ property: "og:url", content: `${SITE_CONFIG.url}${seo.path}` },
			{ property: "og:locale", content: "ja_JP" },
			{ property: "og:locale:alternate", content: "en_US" },
			// Twitter Card
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:title", content: seo.title },
			{ name: "twitter:description", content: seo.description },
			{
				name: "twitter:image",
				content: `${SITE_CONFIG.url}${OGP_DEFAULTS.image}`,
			},
		],
		links: [
			generateCanonicalLink(seo.path, lang),
			...generateHreflangLinks(seo.path),
		],
	};
}

export type SupportedLang = (typeof SITE_CONFIG.locale.supported)[number];

export function getLocalizedSeo(
	page: keyof typeof PAGE_SEO,
	lang?: string | null,
) {
	const seo = PAGE_SEO[page];
	const supportedLangs = SITE_CONFIG.locale.supported;
	const normalizedLang = supportedLangs.includes(
		lang as (typeof supportedLangs)[number],
	)
		? lang
		: null;
	const isJa = normalizedLang === "ja";
	return {
		title: isJa ? seo.titleJa : seo.title,
		description: isJa ? seo.descriptionJa : seo.description,
		path: seo.path,
		lang: isJa ? "ja" : "en",
		ogLocale: isJa ? "ja_JP" : "en_US",
	};
}

export function generateDebugPageMeta(title: string) {
	return {
		meta: [
			{ title: `${title} | STGY Tools (Debug)` },
			{ name: "robots", content: "noindex, nofollow" },
		],
	};
}
