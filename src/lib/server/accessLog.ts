/**
 * アクセスログユーティリティ
 * JSON形式の構造化アクセスログを出力
 */

export interface AccessLogEntry {
	timestamp: string;
	method: string;
	url: string;
	path: string;
	status: number;
	duration: number;
	userAgent?: string;
	referer?: string;
	contentLength?: number;
	requestId?: string;
}

/**
 * アクセスログをJSON形式で出力
 */
export function logAccess(entry: AccessLogEntry): void {
	// 静的アセットのログをスキップ（オプション）
	const skipPaths = [
		"/favicon.svg",
		"/manifest.json",
		"/robots.txt",
		"/sitemap.xml",
	];
	const skipExtensions = [
		".js",
		".css",
		".woff",
		".woff2",
		".ttf",
		".png",
		".svg",
		".wasm",
	];

	const shouldSkip =
		skipPaths.includes(entry.path) ||
		skipExtensions.some((ext) => entry.path.endsWith(ext)) ||
		entry.path.startsWith("/assets/") ||
		entry.path.startsWith("/fonts/") ||
		entry.path.startsWith("/icons/") ||
		entry.path.startsWith("/backgrounds/") ||
		entry.path.startsWith("/palette-icons/");

	if (shouldSkip) {
		return;
	}

	const logEntry = {
		level:
			entry.status >= 500 ? "error" : entry.status >= 400 ? "warn" : "info",
		...entry,
	};

	console.log(JSON.stringify(logEntry));
}

/**
 * リクエストからログエントリを生成するためのコンテキストを作成
 */
export function createLogContext(request: Request): {
	startTime: number;
	url: URL;
	method: string;
	userAgent: string | null;
	referer: string | null;
	requestId: string;
} {
	return {
		startTime: Date.now(),
		url: new URL(request.url),
		method: request.method,
		userAgent: request.headers.get("user-agent"),
		referer: request.headers.get("referer"),
		requestId: request.headers.get("x-request-id") || crypto.randomUUID(),
	};
}

/**
 * レスポンスからログエントリを完成させてログを出力
 */
export function logResponse(
	context: ReturnType<typeof createLogContext>,
	response: Response,
): void {
	const entry: AccessLogEntry = {
		timestamp: new Date(context.startTime).toISOString(),
		method: context.method,
		url: context.url.href,
		path: context.url.pathname,
		status: response.status,
		duration: Date.now() - context.startTime,
		userAgent: context.userAgent ?? undefined,
		referer: context.referer ?? undefined,
		contentLength: (() => {
			const cl = response.headers.get("content-length");
			return cl ? Number.parseInt(cl, 10) : undefined;
		})(),
		requestId: context.requestId,
	};

	logAccess(entry);
}
