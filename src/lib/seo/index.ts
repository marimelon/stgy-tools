/**
 * SEO関連のユーティリティ
 */

/** サイトの基本情報 */
export const SITE_CONFIG = {
	name: "STGY Tools",
	description:
		"FFXIV Strategy Board viewer and editor. Decode and create stgy codes for raid strategy diagrams.",
	descriptionJa:
		"FFXIV 作戦盤のビューアー・エディター。stgyコードのデコード・作成に対応。",
	url: "https://stgy-tools.marime.net",
	locale: {
		default: "ja",
		supported: ["ja", "en"] as const,
	},
} as const;

/** ページごとのSEO情報 */
export const PAGE_SEO = {
	home: {
		title: "STGY Tools - FFXIV Strategy Board Viewer",
		titleJa: "STGY Tools - FFXIV 作戦盤ビューアー",
		description:
			"View and decode FFXIV Strategy Board (stgy) codes. Visualize raid strategies with interactive SVG rendering.",
		descriptionJa:
			"FFXIV 作戦盤のstgyコードを表示・デコード。インタラクティブなSVGレンダリングでレイド攻略を可視化。",
		path: "/",
	},
	editor: {
		title: "Strategy Board Editor | STGY Tools",
		titleJa: "作戦盤エディター | STGY Tools",
		description:
			"Create and edit FFXIV Strategy Board diagrams. Full-featured editor with layers, groups, and export to stgy codes.",
		descriptionJa:
			"FFXIV 作戦盤のダイアグラムを作成・編集。レイヤー、グループ、stgyコード出力に対応した多機能エディター。",
		path: "/editor",
	},
	imageGenerator: {
		title: "FFXIV Strategy Board Image Generator | STGY Tools",
		titleJa: "FFXIV 作戦盤画像ジェネレーター | STGY Tools",
		description:
			"Generate shareable images from FFXIV Strategy Board codes. Create PNG or SVG images for Discord, Twitter, and other platforms.",
		descriptionJa:
			"FFXIV 作戦盤コードから共有可能な画像を生成。Discord、Twitter向けのPNG/SVG画像を作成。",
		path: "/image/generate",
	},
} as const;

/** OGP共通設定 */
export const OGP_DEFAULTS = {
	type: "website",
	siteName: "STGY Tools",
	image: "/favicon.svg",
	imageWidth: "512",
	imageHeight: "384",
} as const;

/** JSON-LD WebApplication スキーマ */
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

/** JSON-LD BreadcrumbList スキーマ */
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

/** hreflang リンク生成 */
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

/** canonical URL 生成 */
export function generateCanonicalLink(path: string) {
	return {
		rel: "canonical",
		href: `${SITE_CONFIG.url}${path}`,
	};
}

/** 共通メタタグ生成 */
export function generateCommonMeta(page: keyof typeof PAGE_SEO) {
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
			generateCanonicalLink(seo.path),
			...generateHreflangLinks(seo.path),
		],
	};
}

/** デバッグページ用メタタグ（noindex） */
export function generateDebugPageMeta(title: string) {
	return {
		meta: [
			{ title: `${title} | STGY Tools (Debug)` },
			{ name: "robots", content: "noindex, nofollow" },
		],
	};
}
