import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig, type Plugin } from "vitest/config";
import viteTsConfigPaths from "vite-tsconfig-paths";

const baseConfig = {
	plugins: [viteTsConfigPaths()],
};

/**
 * Vite plugin to replace server-only modules with mocks in browser tests
 */
function serverModuleMock(): Plugin {
	const mockPath = new URL(
		"./src/__tests__/mocks/empty-module.ts",
		import.meta.url,
	).pathname;

	return {
		name: "server-module-mock",
		enforce: "pre",
		resolveId(id) {
			// cloudflareContext uses node:async_hooks
			if (id.includes("cloudflareContext")) {
				return mockPath;
			}
			return null;
		},
	};
}

const baseTestConfig = {
	globals: true,
};

export default defineConfig({
	test: {
		projects: [
			// ユニットテスト
			mergeConfig(baseConfig, {
				test: {
					...baseTestConfig,
					name: "unit",
					environment: "jsdom",
					include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
					exclude: ["src/**/*.browser.test.ts", "src/**/*.browser.test.tsx"],
					setupFiles: ["./src/__tests__/setup.ts"],
				},
			}),
			// ブラウザテスト（E2E）
			mergeConfig(baseConfig, {
				plugins: [serverModuleMock()],
				resolve: {
					alias: [
						// サーバー専用モジュールをブラウザテストで空モジュールに置換
						{
							find: "@tanstack/start-storage-context",
							replacement: new URL(
								"./src/__tests__/mocks/empty-module.ts",
								import.meta.url,
							).pathname,
						},
						{
							find: "@tanstack/react-start/server",
							replacement: new URL(
								"./src/__tests__/mocks/empty-module.ts",
								import.meta.url,
							).pathname,
						},
					],
				},
				optimizeDeps: {
					include: [
						"react",
						"react/jsx-runtime",
						"react-dom",
						"@dnd-kit/core",
						"@dnd-kit/modifiers",
						"@dnd-kit/sortable",
						"@dnd-kit/utilities",
						"@tanstack/react-router",
					],
					exclude: [
						"@tanstack/react-start",
						"@tanstack/react-start/server",
						"@tanstack/start-storage-context",
					],
				},
				test: {
					...baseTestConfig,
					name: "browser",
					include: ["src/**/*.browser.test.ts", "src/**/*.browser.test.tsx"],
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: "chromium" }],
					},
				},
			}),
		],
	},
});
