/**
 * Feature Flags - Server-side feature flag management
 *
 * Controls feature enable/disable based on environment variables
 * and provides them in a client-consumable format
 */

import { createServerFn } from "@tanstack/react-start";

export interface FeatureFlags {
	/** Whether short links feature is enabled */
	shortLinksEnabled: boolean;
}

/**
 * Server function to get feature flags
 *
 * Called from route loaders on the client side.
 * Uses dynamic imports to exclude server-only modules from client bundle.
 */
export const getFeatureFlagsFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<FeatureFlags> => {
		const { isShortLinksEnabled } = await import("./shortLinks");
		return {
			shortLinksEnabled: isShortLinksEnabled(),
		};
	},
);
