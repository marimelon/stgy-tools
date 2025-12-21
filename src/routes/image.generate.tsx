/**
 * 画像URL生成ページ
 * stgyコードを入力して画像URLを生成する
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { decodeStgy } from "@/lib/stgy/decoder";
import { parseBoardData } from "@/lib/stgy/parser";

export const Route = createFileRoute("/image/generate")({
	component: ImageGeneratePage,
});

function ImageGeneratePage() {
	const [code, setCode] = useState("");
	const [format, setFormat] = useState<"png" | "svg">("png");
	const [generatedUrl, setGeneratedUrl] = useState("");
	const [previewUrl, setPreviewUrl] = useState("");
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState("");

	const generateUrl = useCallback(() => {
		if (!code.trim()) return;

		// stgyコードの解析を試みる
		try {
			const binary = decodeStgy(code.trim());
			parseBoardData(binary);
		} catch (e) {
			const message = e instanceof Error ? e.message : "不明なエラー";
			setError(`stgyコードの解析に失敗しました: ${message}`);
			setGeneratedUrl("");
			setPreviewUrl("");
			return;
		}

		setError("");
		const baseUrl = window.location.origin;
		const encodedCode = encodeURIComponent(code.trim());
		const url =
			format === "png"
				? `${baseUrl}/image?code=${encodedCode}`
				: `${baseUrl}/image?code=${encodedCode}&format=svg`;

		setGeneratedUrl(url);
		setPreviewUrl(`/image?code=${encodedCode}`);
		setCopied(false);
	}, [code, format]);

	const copyToClipboard = useCallback(async () => {
		if (!generatedUrl) return;
		try {
			await navigator.clipboard.writeText(generatedUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// フォールバック
			const textarea = document.createElement("textarea");
			textarea.value = generatedUrl;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [generatedUrl]);

	return (
		<div style={styles.container}>
			<div style={styles.card}>
				<h1 style={styles.title}>画像URL生成</h1>
				<p style={styles.description}>
					stgyコードを入力して、画像URLを生成します。
				</p>

				<div style={styles.inputGroup}>
					<label style={styles.label}>stgyコード</label>
					<textarea
						style={styles.textarea}
						value={code}
						onChange={(e) => {
							setCode(e.target.value);
							setError("");
						}}
						placeholder="[stgy:a...]"
						rows={4}
					/>
				</div>

				<div style={styles.inputGroup}>
					<label style={styles.label}>出力フォーマット</label>
					<div style={styles.radioGroup}>
						<label style={styles.radioLabel}>
							<input
								type="radio"
								name="format"
								value="png"
								checked={format === "png"}
								onChange={() => setFormat("png")}
								style={styles.radio}
							/>
							PNG
						</label>
						<label style={styles.radioLabel}>
							<input
								type="radio"
								name="format"
								value="svg"
								checked={format === "svg"}
								onChange={() => setFormat("svg")}
								style={styles.radio}
							/>
							SVG
						</label>
					</div>
				</div>

				<button
					type="button"
					style={styles.button}
					onClick={generateUrl}
					disabled={!code.trim()}
				>
					URL生成
				</button>

				{error && (
					<div style={styles.errorContainer}>
						<span style={styles.errorIcon}>⚠️</span>
						<span style={styles.errorText}>{error}</span>
					</div>
				)}

				{generatedUrl && (
					<div style={styles.resultSection}>
						<div style={styles.inputGroup}>
							<label style={styles.label}>生成されたURL</label>
							<div style={styles.urlContainer}>
								<input
									type="text"
									style={styles.urlInput}
									value={generatedUrl}
									readOnly
								/>
								<button
									type="button"
									style={styles.copyButton}
									onClick={copyToClipboard}
								>
									{copied ? "✓ コピー済み" : "コピー"}
								</button>
							</div>
						</div>

						<div style={styles.inputGroup}>
							<label style={styles.label}>プレビュー</label>
							<div style={styles.previewContainer}>
								<img
									src={previewUrl}
									alt="プレビュー"
									style={styles.previewImage}
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = "none";
									}}
								/>
							</div>
						</div>

						<div style={styles.inputGroup}>
							<label style={styles.label}>HTMLコード</label>
							<code style={styles.codeBlock}>
								{`<img src="${generatedUrl}" alt="戦略ボード" />`}
							</code>
						</div>

						<div style={styles.inputGroup}>
							<label style={styles.label}>Markdownコード</label>
							<code style={styles.codeBlock}>
								{`![戦略ボード](${generatedUrl})`}
							</code>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

const styles: Record<string, React.CSSProperties> = {
	container: {
		minHeight: "100vh",
		backgroundColor: "#0a0a0a",
		padding: "2rem",
		display: "flex",
		justifyContent: "center",
		alignItems: "flex-start",
	},
	card: {
		backgroundColor: "#1a1a1a",
		borderRadius: "12px",
		padding: "2rem",
		maxWidth: "800px",
		width: "100%",
		boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
	},
	title: {
		color: "#fff",
		fontSize: "1.5rem",
		fontWeight: "bold",
		marginBottom: "0.5rem",
	},
	description: {
		color: "#888",
		marginBottom: "1.5rem",
	},
	inputGroup: {
		marginBottom: "1rem",
	},
	label: {
		display: "block",
		color: "#ccc",
		fontSize: "0.875rem",
		marginBottom: "0.5rem",
	},
	textarea: {
		width: "100%",
		padding: "0.75rem",
		backgroundColor: "#2a2a2a",
		border: "1px solid #444",
		borderRadius: "6px",
		color: "#fff",
		fontSize: "0.875rem",
		fontFamily: "monospace",
		resize: "vertical",
		boxSizing: "border-box",
	},
	radioGroup: {
		display: "flex",
		gap: "1rem",
	},
	radioLabel: {
		color: "#ccc",
		display: "flex",
		alignItems: "center",
		gap: "0.5rem",
		cursor: "pointer",
	},
	radio: {
		accentColor: "#3b82f6",
	},
	button: {
		backgroundColor: "#3b82f6",
		color: "#fff",
		border: "none",
		borderRadius: "6px",
		padding: "0.75rem 1.5rem",
		fontSize: "1rem",
		fontWeight: "bold",
		cursor: "pointer",
		width: "100%",
		marginTop: "0.5rem",
	},
	resultSection: {
		marginTop: "2rem",
		paddingTop: "2rem",
		borderTop: "1px solid #333",
	},
	urlContainer: {
		display: "flex",
		gap: "0.5rem",
	},
	urlInput: {
		flex: 1,
		padding: "0.75rem",
		backgroundColor: "#2a2a2a",
		border: "1px solid #444",
		borderRadius: "6px",
		color: "#fff",
		fontSize: "0.75rem",
		fontFamily: "monospace",
	},
	copyButton: {
		backgroundColor: "#444",
		color: "#fff",
		border: "none",
		borderRadius: "6px",
		padding: "0.75rem 1rem",
		fontSize: "0.875rem",
		cursor: "pointer",
		whiteSpace: "nowrap",
	},
	previewContainer: {
		backgroundColor: "#2a2a2a",
		borderRadius: "6px",
		padding: "1rem",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		minHeight: "200px",
	},
	previewImage: {
		maxWidth: "100%",
		maxHeight: "400px",
		borderRadius: "4px",
	},
	codeBlock: {
		display: "block",
		padding: "0.75rem",
		backgroundColor: "#2a2a2a",
		border: "1px solid #444",
		borderRadius: "6px",
		color: "#10b981",
		fontSize: "0.75rem",
		fontFamily: "monospace",
		overflowX: "auto",
		wordBreak: "break-all",
	},
	errorContainer: {
		marginTop: "1rem",
		padding: "0.75rem 1rem",
		backgroundColor: "rgba(239, 68, 68, 0.1)",
		border: "1px solid #ef4444",
		borderRadius: "6px",
		display: "flex",
		alignItems: "center",
		gap: "0.5rem",
	},
	errorIcon: {
		fontSize: "1rem",
	},
	errorText: {
		color: "#ef4444",
		fontSize: "0.875rem",
	},
};

