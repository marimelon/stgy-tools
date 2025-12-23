/**
 * 画像URL生成ページ
 * stgyコードを入力して画像URLを生成する
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { decodeStgy } from "@/lib/stgy/decoder";
import { parseBoardData } from "@/lib/stgy/parser";
import type { BoardData } from "@/lib/stgy/types";
import { BoardViewer } from "@/components/board/BoardViewer";

/** デバウンス遅延時間 (ms) */
const DEBOUNCE_DELAY = 300;

/** キャンバスサイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

/** タイトルバーの高さ */
const TITLE_BAR_HEIGHT = 32;

/** 枠線の太さ */
const BORDER_WIDTH = 2;

/** タイトルバーコンポーネント */
function TitleBar({ title, width }: { title: string; width: number }) {
	return (
		<g>
			{/* 背景バー */}
			<rect
				x={BORDER_WIDTH}
				y={BORDER_WIDTH}
				width={width - BORDER_WIDTH * 2}
				height={TITLE_BAR_HEIGHT}
				fill="#D2D2D2"
			/>
			{/* 下線 */}
			<line
				x1={BORDER_WIDTH}
				y1={TITLE_BAR_HEIGHT + BORDER_WIDTH}
				x2={width - BORDER_WIDTH}
				y2={TITLE_BAR_HEIGHT + BORDER_WIDTH}
				stroke="rgba(128, 128, 128, 0.3)"
				strokeWidth={1}
			/>
			{/* タイトルテキスト */}
			<text
				x={BORDER_WIDTH + 12}
				y={BORDER_WIDTH + TITLE_BAR_HEIGHT / 2}
				fill="#646464"
				fontSize="14"
				fontFamily="sans-serif"
				fontWeight="500"
				textAnchor="start"
				dominantBaseline="central"
			>
				{title}
			</text>
		</g>
	);
}

/** 枠線コンポーネント */
function BorderFrame({ width, height }: { width: number; height: number }) {
	return (
		<rect
			x={BORDER_WIDTH / 2}
			y={BORDER_WIDTH / 2}
			width={width - BORDER_WIDTH}
			height={height - BORDER_WIDTH}
			fill="none"
			stroke="rgba(255, 255, 255, 0.8)"
			strokeWidth={BORDER_WIDTH}
		/>
	);
}

/** プレビュー用のボードビューワー（タイトルバー対応） */
function BoardPreview({
	boardData,
	showTitle,
}: {
	boardData: BoardData;
	showTitle: boolean;
}) {
	const totalHeight = showTitle
		? CANVAS_HEIGHT + TITLE_BAR_HEIGHT
		: CANVAS_HEIGHT;
	const contentOffsetY = showTitle ? TITLE_BAR_HEIGHT : 0;

	return (
		<svg
			width={CANVAS_WIDTH}
			height={totalHeight}
			viewBox={`0 0 ${CANVAS_WIDTH} ${totalHeight}`}
			style={{ backgroundColor: "#1a1a1a" }}
			role="img"
			aria-label={boardData.name || "Strategy Board"}
		>
			{/* 全体背景色 */}
			<rect width={CANVAS_WIDTH} height={totalHeight} fill="#1a1a1a" />

			{/* タイトルバー */}
			{showTitle && <TitleBar title={boardData.name} width={CANVAS_WIDTH} />}

			{/* コンテンツ領域 */}
			<foreignObject
				x={0}
				y={contentOffsetY}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
			>
				<div
					// @ts-expect-error xmlns is valid for foreignObject content
					xmlns="http://www.w3.org/1999/xhtml"
				>
					<BoardViewer boardData={boardData} />
				</div>
			</foreignObject>

			{/* 枠線 */}
			{showTitle && <BorderFrame width={CANVAS_WIDTH} height={totalHeight} />}
		</svg>
	);
}

export const Route = createFileRoute("/image/generate")({
	component: ImageGeneratePage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			code: typeof search.code === "string" ? search.code : undefined,
		};
	},
});

/** スケールオプション */
const SCALE_OPTIONS = [
	{ value: "1", label: "1x (512×384)", width: 512 },
	{ value: "1.5", label: "1.5x (768×576)", width: 768 },
	{ value: "2", label: "2x (1024×768)", width: 1024 },
] as const;

/** 言語オプション */
const LANGUAGE_OPTIONS = [
	{ value: "ja", label: "日本語" },
	{ value: "en", label: "English" },
] as const;

function ImageGeneratePage() {
	const { t, i18n } = useTranslation();
	const { code: initialCode } = Route.useSearch();
	const [code, setCode] = useState(initialCode ?? "");
	const [format, setFormat] = useState<"png" | "svg">("png");
	const [scale, setScale] = useState("1");
	const [showTitle, setShowTitle] = useState(false);
	const [generatedUrl, setGeneratedUrl] = useState("");
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState("");
	const [boardName, setBoardName] = useState("");
	const [boardData, setBoardData] = useState<BoardData | null>(null);
	const [previewMode, setPreviewMode] = useState<"preview" | "actual">("preview");
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	
	// Accessible IDs
	const stgyCodeId = useId();
	const formatGroupId = useId();
	const sizeGroupId = useId();
	const generatedUrlId = useId();

	const generateUrl = useCallback(
		(codeToUse: string) => {
			if (!codeToUse.trim()) {
				setGeneratedUrl("");
				setBoardName("");
				setBoardData(null);
				setError("");
				return;
			}

			// stgyコードの解析を試みる
			let parsedBoardData: BoardData;
			try {
				const binary = decodeStgy(codeToUse.trim());
				parsedBoardData = parseBoardData(binary);
			} catch (e) {
				const message =
					e instanceof Error ? e.message : t("imageGenerator.unknownError");
				setError(t("imageGenerator.parseError", { message }));
				setGeneratedUrl("");
				setBoardName("");
				setBoardData(null);
				return;
			}
			setBoardName(parsedBoardData.name);
			setBoardData(parsedBoardData);

			setError("");
			const baseUrl = window.location.origin;

			// クエリパラメータを構築
			const params = new URLSearchParams();
			params.set("code", codeToUse.trim());

			if (format === "svg") {
				params.set("format", "svg");
			} else if (scale !== "1") {
				params.set("scale", scale);
			}

			if (showTitle) {
				params.set("title", "1");
			}

			const url = `${baseUrl}/image?${params.toString()}`;
			setGeneratedUrl(url);
			setCopied(false);
		},
		[format, scale, showTitle, t],
	);

	// コード、フォーマット、スケール、タイトル表示が変更されたら自動的にURL生成
	useEffect(() => {
		// デバウンスタイマーをクリア
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// デバウンス後にURL生成
		debounceTimerRef.current = setTimeout(() => {
			generateUrl(code);
		}, DEBOUNCE_DELAY);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [code, format, scale, showTitle, generateUrl]);

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

	const changeLanguage = useCallback(
		(lang: string) => {
			i18n.changeLanguage(lang);
		},
		[i18n],
	);

	const strategyBoardAlt = boardName || t("imageGenerator.strategyBoard");

	return (
		<div style={styles.container}>
			{/* ヘッダー */}
			<header style={styles.header}>
				<h1 style={styles.headerTitle}>{t("imageGenerator.pageTitle")}</h1>
				<nav style={styles.nav}>
					<Link to="/" style={styles.navLink}>
						{t("nav.viewer")}
					</Link>
					<Link to="/editor" style={styles.navLink}>
						{t("nav.editor")}
					</Link>
					{/* 言語セレクター */}
					<select
						style={styles.languageSelect}
						value={i18n.language.split("-")[0]}
						onChange={(e) => changeLanguage(e.target.value)}
						aria-label={t("language.label")}
					>
						{LANGUAGE_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</nav>
			</header>

			<div style={styles.card}>
				<h2 style={styles.title}>{t("imageGenerator.title")}</h2>
				<p style={styles.description}>{t("imageGenerator.description")}</p>

				<div style={styles.inputGroup}>
					<label htmlFor={stgyCodeId} style={styles.label}>{t("imageGenerator.stgyCode")}</label>
					<textarea
						id={stgyCodeId}
						style={styles.textarea}
						value={code}
						onChange={(e) => setCode(e.target.value)}
						placeholder={t("imageGenerator.stgyCodePlaceholder")}
						rows={4}
					/>
				</div>

				<div style={styles.inputGroup}>
					<span id={formatGroupId} style={styles.label}>{t("imageGenerator.outputFormat")}</span>
					<div style={styles.radioGroup} role="radiogroup" aria-labelledby={formatGroupId}>
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

				{format === "png" && (
					<div style={styles.inputGroup}>
						<span id={sizeGroupId} style={styles.label}>{t("imageGenerator.outputSize")}</span>
						<div style={styles.radioGroup} role="radiogroup" aria-labelledby={sizeGroupId}>
							{SCALE_OPTIONS.map((option) => (
								<label key={option.value} style={styles.radioLabel}>
									<input
										type="radio"
										name="scale"
										value={option.value}
										checked={scale === option.value}
										onChange={() => setScale(option.value)}
										style={styles.radio}
									/>
									{option.label}
								</label>
							))}
						</div>
					</div>
				)}

				<div style={styles.inputGroup}>
					<label style={styles.checkboxLabel}>
						<input
							type="checkbox"
							checked={showTitle}
							onChange={(e) => setShowTitle(e.target.checked)}
							style={styles.checkbox}
						/>
						{t("imageGenerator.showBoardName")}
					</label>
				</div>

				{error && (
					<div style={styles.errorContainer}>
						<span style={styles.errorIcon}>⚠️</span>
						<span style={styles.errorText}>{error}</span>
					</div>
				)}

				{generatedUrl && (
					<div style={styles.resultSection}>
						<div style={styles.inputGroup}>
							<label htmlFor={generatedUrlId} style={styles.label}>
								{t("imageGenerator.generatedUrl")}
							</label>
							<div style={styles.urlContainer}>
								<input
									id={generatedUrlId}
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
									{copied
										? `✓ ${t("common.copied")}`
										: t("common.copy")}
								</button>
							</div>
						</div>

						<div style={styles.inputGroup}>
							<div style={styles.previewTabs}>
								<button
									type="button"
									style={{
										...styles.previewTab,
										...(previewMode === "preview" ? styles.previewTabActive : {}),
									}}
									onClick={() => setPreviewMode("preview")}
								>
									{t("imageGenerator.previewTab")}
								</button>
								<button
									type="button"
									style={{
										...styles.previewTab,
										...(previewMode === "actual" ? styles.previewTabActive : {}),
									}}
									onClick={() => setPreviewMode("actual")}
								>
									{t("imageGenerator.actualImageTab")}
								</button>
							</div>
							<div style={styles.previewContainer}>
								{previewMode === "preview" ? (
									boardData && (
										<BoardPreview boardData={boardData} showTitle={showTitle} />
									)
								) : (
									<img
										src={generatedUrl}
										alt={strategyBoardAlt}
										style={styles.previewImage}
										onError={(e) => {
											(e.target as HTMLImageElement).style.display = "none";
										}}
									/>
								)}
							</div>
						</div>

						<div style={styles.inputGroup}>
							<span style={styles.label}>{t("imageGenerator.htmlCode")}</span>
							<code style={styles.codeBlock}>
								{`<img src="${generatedUrl}" alt="${strategyBoardAlt}" />`}
							</code>
						</div>

						<div style={styles.inputGroup}>
							<span style={styles.label}>
								{t("imageGenerator.markdownCode")}
							</span>
							<code style={styles.codeBlock}>
								{`![${strategyBoardAlt}](${generatedUrl})`}
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
		flexDirection: "column",
		alignItems: "center",
		gap: "1.5rem",
	},
	header: {
		width: "100%",
		maxWidth: "800px",
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
	},
	headerTitle: {
		color: "#fff",
		fontSize: "1.25rem",
		fontWeight: "bold",
		margin: 0,
	},
	nav: {
		display: "flex",
		gap: "1.5rem",
		alignItems: "center",
	},
	navLink: {
		color: "#888",
		fontSize: "0.875rem",
		fontWeight: 500,
		textDecoration: "none",
		transition: "color 0.2s",
	},
	languageSelect: {
		backgroundColor: "#2a2a2a",
		color: "#fff",
		border: "1px solid #444",
		borderRadius: "4px",
		padding: "0.375rem 0.5rem",
		fontSize: "0.75rem",
		cursor: "pointer",
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
		fontSize: "1.25rem",
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
	checkboxLabel: {
		color: "#ccc",
		display: "flex",
		alignItems: "center",
		gap: "0.5rem",
		cursor: "pointer",
		fontSize: "0.875rem",
	},
	checkbox: {
		accentColor: "#3b82f6",
		width: "16px",
		height: "16px",
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
	previewTabs: {
		display: "flex",
		gap: "0.25rem",
		marginBottom: "0.5rem",
	},
	previewTab: {
		backgroundColor: "transparent",
		color: "#888",
		border: "none",
		borderBottom: "2px solid transparent",
		padding: "0.5rem 1rem",
		fontSize: "0.875rem",
		cursor: "pointer",
		transition: "color 0.2s, border-color 0.2s",
	},
	previewTabActive: {
		color: "#fff",
		borderBottomColor: "#3b82f6",
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
