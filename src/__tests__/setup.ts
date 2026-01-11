/**
 * Vitest global setup for React component testing in jsdom environment.
 */

import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Mock PointerCapture API for jsdom
if (typeof Element !== "undefined") {
	Element.prototype.setPointerCapture =
		Element.prototype.setPointerCapture || (() => {});
	Element.prototype.releasePointerCapture =
		Element.prototype.releasePointerCapture || (() => {});
}

afterEach(() => {
	cleanup();
});
