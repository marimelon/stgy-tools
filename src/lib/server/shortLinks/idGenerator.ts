/**
 * 短縮ID生成ロジック
 *
 * stgyコードからハッシュベースでIDを生成。
 * 同一stgyコードは同一IDを返す（決定論的）。
 * 衝突時はattemptを増やして再生成。
 */

const ID_LENGTH = 7;

/** Base62文字セット（URL-safe） */
const BASE62_CHARS =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Node.js の crypto モジュールを取得
 * Web Crypto API が使えない環境用
 */
async function getNodeCrypto(): Promise<typeof import("node:crypto") | null> {
	try {
		return await import("node:crypto");
	} catch {
		return null;
	}
}

/**
 * 文字列をSHA-256でハッシュ化
 * Web Crypto API を使用（Workers/Node.js両対応）
 */
async function sha256(input: string): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);

	// Web Crypto API が利用可能な場合
	if (crypto?.subtle) {
		const hashBuffer = await crypto.subtle.digest("SHA-256", data);
		return new Uint8Array(hashBuffer);
	}

	// Node.js の crypto モジュールを使用
	const nodeCrypto = await getNodeCrypto();
	if (nodeCrypto) {
		const hash = nodeCrypto.createHash("sha256");
		hash.update(Buffer.from(data));
		return new Uint8Array(hash.digest());
	}

	throw new Error("No crypto implementation available");
}

/**
 * バイト配列をBase62文字列に変換
 */
function bytesToBase62(bytes: Uint8Array, length: number): string {
	let result = "";
	for (let i = 0; i < length; i++) {
		// 各バイトをBase62の1文字にマッピング
		const byte = bytes[i % bytes.length];
		result += BASE62_CHARS[byte % 62];
	}
	return result;
}

/**
 * stgyコードから短縮IDを生成
 *
 * @param stgy stgyコード
 * @param attempt 衝突時のリトライ回数（0から開始）
 * @returns 6文字の短縮ID
 *
 * 同一stgyコードと同一attemptなら、常に同じIDを返す（決定論的）
 */
export async function generateShortId(
	stgy: string,
	attempt: number = 0,
): Promise<string> {
	// attemptが0以外の場合はソルトを追加
	const input = attempt === 0 ? stgy : `${stgy}::${attempt}`;
	const hash = await sha256(input);
	return bytesToBase62(hash, ID_LENGTH);
}

/**
 * 短縮IDの形式が有効かチェック
 */
export function isValidShortId(id: string): boolean {
	if (id.length !== ID_LENGTH) return false;
	return /^[0-9A-Za-z]+$/.test(id);
}

/**
 * stgyコードの形式が有効かチェック（簡易バリデーション）
 */
export function isValidStgyCode(stgy: string): boolean {
	// [stgy: で始まり ] で終わる
	if (!stgy.startsWith("[stgy:") || !stgy.endsWith("]")) {
		return false;
	}
	// 最低限の長さ
	if (stgy.length < 10) {
		return false;
	}
	return true;
}
