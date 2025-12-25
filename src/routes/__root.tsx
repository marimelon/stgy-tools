import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
// Initialize i18n
import i18n from "../lib/i18n";
import {
	generateWebApplicationSchema,
	OGP_DEFAULTS,
	SITE_CONFIG,
} from "../lib/seo";
import appCss from "../styles.css?url";

// JSON-LD structured data
const jsonLdScript = JSON.stringify(generateWebApplicationSchema());

export const Route = createRootRoute({
	beforeLoad: ({ search }) => {
		// SSRでi18nの言語を設定
		const langParam = (search as { lang?: string }).lang;
		const supportedLangs = SITE_CONFIG.locale.supported;
		const isSupported = supportedLangs.includes(
			langParam as (typeof supportedLangs)[number],
		);
		const lang = isSupported ? langParam : SITE_CONFIG.locale.default;
		if (i18n.language !== lang) {
			i18n.changeLanguage(lang);
		}
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: SITE_CONFIG.name,
			},
			// Default description (overridden by child routes)
			{
				name: "description",
				content: SITE_CONFIG.description,
			},
			// Default OGP (overridden by child routes)
			{
				property: "og:site_name",
				content: OGP_DEFAULTS.siteName,
			},
			{
				property: "og:type",
				content: OGP_DEFAULTS.type,
			},
			{
				property: "og:locale",
				content: "ja_JP",
			},
			{
				property: "og:locale:alternate",
				content: "en_US",
			},
		],
		links: [
			// Google Fonts preconnect
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			// Google Fonts - load before main CSS
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
			// Apple Touch Icon
			{
				rel: "apple-touch-icon",
				href: "/favicon.svg",
			},
			// Manifest
			{
				rel: "manifest",
				href: "/manifest.json",
			},
		],
		scripts: [
			// JSON-LD structured data
			{
				type: "application/ld+json",
				children: jsonLdScript,
			},
		],
	}),

	component: RootDocument,
});

// Initial background color to prevent FOUC
const initialStyle = {
	backgroundColor: "oklch(0.11 0.012 235)",
	color: "oklch(0.93 0.008 235)",
};

function RootDocument() {
	// SSRでも動作するようにURLの検索パラメータから言語を取得
	const search = useRouterState({
		select: (s) => s.location.search as { lang?: string },
	});
	// サポートされている言語のみ認識、それ以外はデフォルト言語にフォールバック
	const supportedLangs = SITE_CONFIG.locale.supported;
	const isSupported = supportedLangs.includes(
		search.lang as (typeof supportedLangs)[number],
	);
	const lang = isSupported ? (search.lang as "ja" | "en") : "ja";

	// i18nの言語も同期（クライアントサイドのみ）
	const { i18n } = useTranslation();
	if (typeof window !== "undefined" && i18n.language !== lang) {
		i18n.changeLanguage(lang);
	}

	// ハイドレーション後にトランジションを有効化（FOUC対策）
	useEffect(() => {
		document.documentElement.classList.add("hydrated");
	}, []);

	return (
		<html lang={lang} style={initialStyle}>
			<head>
				{/* FOUC Prevention - inline style before any CSS loads */}
				<style
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Required for FOUC prevention
					dangerouslySetInnerHTML={{
						__html: `
							html:not(.hydrated) *, html:not(.hydrated) *::before, html:not(.hydrated) *::after {
								transition: none !important;
								animation: none !important;
							}
							html:not(.hydrated) body {
								visibility: hidden;
							}
							html.hydrated body {
								visibility: visible;
							}
						`,
					}}
				/>
				<HeadContent />
			</head>
			<body style={initialStyle}>
				<Outlet />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
