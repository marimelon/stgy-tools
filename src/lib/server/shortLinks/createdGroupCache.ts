/**
 * Temporary cache for newly created groups
 *
 * Stores group data in sessionStorage to handle KV propagation delay.
 * When a group is created, data is cached locally so it can be displayed
 * immediately even if KV hasn't propagated yet.
 */

const CACHE_KEY_PREFIX = "created-group:";
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

export interface CachedGroupData {
	name: string;
	description?: string;
	stgyCodes: string[];
	version: number;
}

interface CachedGroupEntry {
	data: CachedGroupData;
	createdAt: number;
}

/**
 * Cache created group data for immediate use
 */
export function cacheCreatedGroup(
	groupId: string,
	data: {
		name: string;
		description?: string;
		stgyCodes: string[];
	},
): void {
	const cacheEntry: CachedGroupEntry = {
		data: {
			name: data.name,
			description: data.description,
			stgyCodes: data.stgyCodes,
			version: 1,
		},
		createdAt: Date.now(),
	};

	try {
		sessionStorage.setItem(
			`${CACHE_KEY_PREFIX}${groupId}`,
			JSON.stringify(cacheEntry),
		);
	} catch {
		// sessionStorage not available or full - ignore
	}
}

/**
 * Get cached group data if available and not expired
 */
export function getCachedGroup(groupId: string): CachedGroupData | null {
	try {
		const cached = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${groupId}`);
		if (!cached) return null;

		const { data, createdAt } = JSON.parse(cached) as CachedGroupEntry;

		// Check TTL
		if (Date.now() - createdAt > CACHE_TTL_MS) {
			sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${groupId}`);
			return null;
		}

		return data;
	} catch {
		return null;
	}
}

/**
 * Clear cached group data (call when KV data is confirmed available)
 */
export function clearCachedGroup(groupId: string): void {
	try {
		sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${groupId}`);
	} catch {
		// ignore
	}
}
