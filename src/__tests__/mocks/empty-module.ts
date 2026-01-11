/**
 * Mock module for browser tests
 *
 * Used to replace server-only modules that cannot run in browser environment
 */

// Mock for @tanstack/start-storage-context
export function getStartContext() {
	return undefined;
}

export function runWithStartContext<T>(_context: unknown, fn: () => T): T {
	return fn();
}

// Mock for @tanstack/react-start/server exports
export function getRequest() {
	return undefined;
}

export function getRequestHeader() {
	return undefined;
}

export function createServerFn() {
	return () => Promise.resolve(undefined);
}

// Mock for @/lib/server/cloudflareContext
export function getCloudflareContext() {
	return undefined;
}

export function getCloudflareEnv() {
	return undefined;
}

export function runWithCloudflareContext<T>(
	_context: unknown,
	callback: () => T,
): T {
	return callback();
}

export function setGlobalEnv() {}

export function getGlobalEnv() {
	return undefined;
}
