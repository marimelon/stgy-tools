import { defineConfig, type UserConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// BUILD_TARGET 環境変数で切り替え: "cloudflare" | "node"
const buildTarget = process.env.BUILD_TARGET || "cloudflare";

async function getPlugins() {
	const plugins = [
		devtools(),
		viteTsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"],
			},
		}),
	];

	if (buildTarget === "cloudflare") {
		// Cloudflare Workers 用の設定
		const { cloudflare } = await import("@cloudflare/vite-plugin");
		plugins.unshift(cloudflare({ viteEnvironment: { name: "ssr" } }));
	} else {
		// Node.js (Nitro) 用の設定
		const { nitro } = await import("nitro/vite");
		plugins.unshift(
			nitro({
				preset: "node",
			}),
		);
	}

	return plugins;
}

export default defineConfig(async (): Promise<UserConfig> => {
	return {
		plugins: await getPlugins(),
		// ビルドターゲットを定義として埋め込む
		define: {
			"import.meta.env.BUILD_TARGET": JSON.stringify(buildTarget),
		},
		resolve: {
			alias:
				buildTarget === "cloudflare"
					? {
							// Cloudflare ビルド時は @resvg/resvg-js を空のモジュールにエイリアス
							"@resvg/resvg-js": "@cf-wasm/resvg",
						}
					: {},
		},
		// Node.js ビルド時のみ SSR 設定
		...(buildTarget === "node" && {
			ssr: {
				external: ["@resvg/resvg-js"],
			},
			optimizeDeps: {
				exclude: ["@resvg/resvg-js"],
			},
		}),
	};
});
