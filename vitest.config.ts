import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";
import viteTsConfigPaths from "vite-tsconfig-paths";

const baseConfig = {
	plugins: [viteTsConfigPaths()],
};

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
