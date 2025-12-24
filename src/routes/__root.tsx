import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import {
	generateWebApplicationSchema,
	OGP_DEFAULTS,
	SITE_CONFIG,
} from "../lib/seo";
import appCss from "../styles.css?url";

// Initialize i18n
import "../lib/i18n";

// JSON-LD structured data
const jsonLdScript = JSON.stringify(generateWebApplicationSchema());

export const Route = createRootRoute({
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
	return (
		<html lang="ja" style={initialStyle}>
			<head>
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
