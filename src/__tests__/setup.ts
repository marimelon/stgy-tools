/**
 * Vitest グローバルセットアップ
 *
 * jsdom環境でのReactコンポーネントテスト用設定
 */

import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdomでPointerCapture APIをモック
if (typeof Element !== "undefined") {
	Element.prototype.setPointerCapture =
		Element.prototype.setPointerCapture || (() => {});
	Element.prototype.releasePointerCapture =
		Element.prototype.releasePointerCapture || (() => {});
}

// 各テスト後に自動クリーンアップ
afterEach(() => {
	cleanup();
});
