/**
 * Image URL generation page
 * Enter stgy code to generate image URL
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Copy, Download, Loader2, Pencil } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BoardViewer } from "@/components/board/BoardViewer";
import { AppHeader } from "@/components/ui/AppHeader";
import { Footer } from "@/components/ui/Footer";

import {
	generateCanonicalLink,
	generateHreflangLinks,
	getLocalizedSeo,
	SITE_CONFIG,
} from "@/lib/seo";
import { getFeatureFlagsFn } from "@/lib/server/featureFlags";
import { createShortLinkFn } from "@/lib/server/shortLinks/serverFn";
import { decodeStgy } from "@/lib/stgy/decoder";
import { assignBoardObjectIds } from "@/lib/stgy/id";
import { parseBoardData } from "@/lib/stgy/parser";
import type { BoardData } from "@/lib/stgy/types";

/** Debounce delay time (ms) */
const DEBOUNCE_DELAY = 300;

/** Copy success feedback display time (ms) */
const COPY_FEEDBACK_DURATION = 2000;

/** Canvas size */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

/** Title bar height */
const TITLE_BAR_HEIGHT = 32;

/** Border width */
const BORDER_WIDTH = 2;

/** Title bar component */
function TitleBar({ title, width }: { title: string; width: number }) {
	return (
		<g>
			<rect
				x={BORDER_WIDTH}
				y={BORDER_WIDTH}
				width={width - BORDER_WIDTH * 2}
				height={TITLE_BAR_HEIGHT}
				fill="#D2D2D2"
			/>
			<line
				x1={BORDER_WIDTH}
				y1={TITLE_BAR_HEIGHT + BORDER_WIDTH}
				x2={width - BORDER_WIDTH}
				y2={TITLE_BAR_HEIGHT + BORDER_WIDTH}
				stroke="rgba(128, 128, 128, 0.3)"
				strokeWidth={1}
			/>
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

/** Border frame component */
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

/** Board viewer for preview (with title bar support) */
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
		<div className="relative inline-block">
			<svg
				width={CANVAS_WIDTH}
				height={totalHeight}
				viewBox={`0 0 ${CANVAS_WIDTH} ${totalHeight}`}
				className="bg-[#1a1a1a] max-w-full h-auto block"
				role="img"
				aria-label={boardData.name || "Strategy Board"}
			>
				<rect width={CANVAS_WIDTH} height={totalHeight} fill="#1a1a1a" />

				{showTitle && <TitleBar title={boardData.name} width={CANVAS_WIDTH} />}

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

				{showTitle && <BorderFrame width={CANVAS_WIDTH} height={totalHeight} />}
			</svg>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Overlay to prevent right-click on preview internal elements */}
			<div
				className="absolute inset-0"
				onContextMenu={(e) => {
					e.preventDefault();
				}}
			/>
		</div>
	);
}

export const Route = createFileRoute("/image/generate")({
	component: ImageGeneratePage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			stgy: typeof search.stgy === "string" ? search.stgy : undefined,
			lang: typeof search.lang === "string" ? search.lang : undefined,
		};
	},
	loader: async () => {
		const featureFlags = await getFeatureFlagsFn();
		return { featureFlags };
	},
	head: ({ match }) => {
		const { stgy, lang } = match.search;
		const hasCode = Boolean(stgy);
		const seo = getLocalizedSeo("imageGenerator", lang);

		const ogImage = hasCode
			? `${SITE_CONFIG.url}/image?stgy=${encodeURIComponent(stgy as string)}`
			: `${SITE_CONFIG.url}/favicon.svg`;

		const twitterCard = hasCode ? "summary_large_image" : "summary";

		const ogDescription = hasCode
			? seo.lang === "ja"
				? "FFXIV ストラテジーボードのダイアグラムを表示"
				: "View this FFXIV Strategy Board diagram"
			: seo.description;

		return {
			meta: [
				{
					title: seo.title,
				},
				{
					name: "description",
					content: seo.description,
				},
				{
					name: "keywords",
					content:
						"FFXIV, Final Fantasy XIV, Strategy Board, stgy, image generator, raid strategy, FF14",
				},
				// Open Graph
				{
					property: "og:title",
					content: seo.title,
				},
				{
					property: "og:description",
					content: ogDescription,
				},
				{
					property: "og:type",
					content: "website",
				},
				{
					property: "og:url",
					content: `${SITE_CONFIG.url}${seo.path}`,
				},
				{
					property: "og:image",
					content: ogImage,
				},
				{
					property: "og:image:width",
					content: "512",
				},
				{
					property: "og:image:height",
					content: "384",
				},
				{
					property: "og:locale",
					content: seo.ogLocale,
				},
				// Twitter Card
				{
					name: "twitter:card",
					content: twitterCard,
				},
				{
					name: "twitter:title",
					content: seo.title,
				},
				{
					name: "twitter:description",
					content: ogDescription,
				},
				{
					name: "twitter:image",
					content: ogImage,
				},
			],
			links: [
				generateCanonicalLink(seo.path, lang),
				...generateHreflangLinks(seo.path),
			],
		};
	},
});

/** Scale options */
const SCALE_OPTIONS = [
	{ value: "1", label: "1x", size: "512×384" },
	{ value: "2", label: "2x", size: "1024×768" },
	{ value: "3", label: "3x", size: "1536×1152" },
	{ value: "4", label: "4x", size: "2048×1536" },
] as const;

function ImageGeneratePage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { stgy: initialCode } = Route.useSearch();
	const { featureFlags } = Route.useLoaderData();
	const [code, setCode] = useState(initialCode ?? "");
	const [format, setFormat] = useState<"png" | "svg">("png");
	const [scale, setScale] = useState("1");
	const [showTitle, setShowTitle] = useState(false);
	const [generatedUrl, setGeneratedUrl] = useState("");
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState("");
	const [boardName, setBoardName] = useState("");
	const [boardData, setBoardData] = useState<BoardData | null>(null);
	const [previewMode, setPreviewMode] = useState<"preview" | "actual">(
		"preview",
	);
	const [imageLoadError, setImageLoadError] = useState(false);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Accessible IDs
	const stgyCodeId = useId();
	const formatGroupId = useId();
	const sizeGroupId = useId();
	const generatedUrlId = useId();

	const [useShortUrl, setUseShortUrl] = useState(false);
	const [isGeneratingShortUrl, setIsGeneratingShortUrl] = useState(false);
	const [fullUrl, setFullUrl] = useState("");

	const [copiedHtml, setCopiedHtml] = useState(false);
	const [copiedMarkdown, setCopiedMarkdown] = useState(false);

	// Navigate to Editor with the current stgy code via URL parameter
	const handleEditInEditor = useCallback(() => {
		if (!code.trim() || !boardData) return;

		// Navigate to Editor with stgy code as query parameter
		navigate({ to: "/editor", search: { stgy: code.trim() } });
	}, [code, boardData, navigate]);

	// Download image handler
	const handleDownloadImage = useCallback(async () => {
		if (!generatedUrl) return;

		try {
			const response = await fetch(generatedUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;

			// Determine file extension based on format
			const extension = format === "svg" ? "svg" : "png";
			const filename = boardName
				? `${boardName}.${extension}`
				: `strategy-board.${extension}`;

			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch {
			// Fallback: open in new tab if download fails
			window.open(generatedUrl, "_blank");
		}
	}, [generatedUrl, format, boardName]);

	const handleShortUrlChange = useCallback(
		async (checked: boolean) => {
			if (!checked) {
				setUseShortUrl(false);
				if (fullUrl) {
					setGeneratedUrl(fullUrl);
				}
				return;
			}

			if (!code.trim() || !boardData) return;

			setIsGeneratingShortUrl(true);

			try {
				const baseUrl = window.location.origin;
				const result = await createShortLinkFn({
					data: { stgy: code.trim(), baseUrl },
				});

				if (!result.success || !result.data.id) {
					return;
				}

				const params = new URLSearchParams();
				params.set("s", result.data.id);

				if (format === "svg") {
					params.set("format", "svg");
				} else if (scale !== "1") {
					params.set("scale", scale);
				}

				if (showTitle) {
					params.set("title", "1");
				}

				const newShortUrl = `${baseUrl}/image?${params.toString()}`;

				setFullUrl(generatedUrl);
				setGeneratedUrl(newShortUrl);
				setUseShortUrl(true);
			} finally {
				setIsGeneratingShortUrl(false);
			}
		},
		[code, boardData, format, scale, showTitle, generatedUrl, fullUrl],
	);

	const generateUrl = useCallback(
		(codeToUse: string) => {
			if (!codeToUse.trim()) {
				setGeneratedUrl("");
				setBoardName("");
				setBoardData(null);
				setError("");
				return;
			}

			let parsedBoardData: BoardData;
			try {
				const binary = decodeStgy(codeToUse.trim());
				const parsed = parseBoardData(binary);
				parsedBoardData = assignBoardObjectIds(parsed);
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

			const params = new URLSearchParams();
			params.set("stgy", codeToUse.trim());

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
			setImageLoadError(false);
			setUseShortUrl(false);
			setFullUrl("");
		},
		[format, scale, showTitle, t],
	);

	useEffect(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			generateUrl(code);

			const trimmedCode = code.trim();
			const url = new URL(window.location.href);
			if (trimmedCode) {
				url.searchParams.set("stgy", trimmedCode);
			} else {
				url.searchParams.delete("stgy");
			}
			window.history.replaceState(null, "", url.toString());
		}, DEBOUNCE_DELAY);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [code, generateUrl]);

	const copyToClipboard = useCallback(async () => {
		if (!generatedUrl) return;
		try {
			await navigator.clipboard.writeText(generatedUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
		} catch {
			const textarea = document.createElement("textarea");
			textarea.value = generatedUrl;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
			setCopied(true);
			setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
		}
	}, [generatedUrl]);

	const strategyBoardAlt = boardName || t("imageGenerator.strategyBoard");

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<AppHeader currentPage="image" title={t("imageGenerator.pageTitle")} />

			<div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col items-center gap-4 md:gap-6">
				<div className="bg-card rounded-lg lg:rounded-xl p-4 md:p-5 lg:p-6 max-w-[800px] lg:max-w-[1200px] w-full shadow-lg border border-border/50">
					<div className="mb-4 lg:mb-6">
						<h2 className="text-foreground text-base lg:text-xl font-bold mb-2 font-display">
							{t("imageGenerator.title")}
						</h2>
						<p className="text-muted-foreground text-sm">
							{t("imageGenerator.description")}
						</p>
					</div>

					<div className="flex flex-col lg:grid lg:grid-cols-[minmax(300px,1fr)_minmax(400px,1.5fr)] lg:gap-8">
						<div className="flex flex-col gap-1">
							<div className="mb-4">
								<label
									htmlFor={stgyCodeId}
									className="block text-muted-foreground text-sm mb-2"
								>
									{t("imageGenerator.stgyCode")}
								</label>
								<textarea
									id={stgyCodeId}
									className="w-full p-3 bg-secondary/30 border border-border rounded-lg text-foreground text-sm font-mono resize-y min-h-[100px] lg:min-h-[140px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground/50"
									value={code}
									onChange={(e) => setCode(e.target.value)}
									placeholder={t("imageGenerator.stgyCodePlaceholder")}
									rows={4}
								/>
							</div>

							<div className="mb-4">
								<span
									id={formatGroupId}
									className="block text-muted-foreground text-sm mb-2"
								>
									{t("imageGenerator.outputFormat")}
								</span>
								<div
									className="flex flex-col md:inline-flex md:flex-row bg-secondary/30 rounded-lg p-1 gap-1"
									role="radiogroup"
									aria-labelledby={formatGroupId}
								>
									<label
										className={`flex-1 md:flex-none inline-flex items-center justify-center py-2.5 md:py-2 px-5 rounded-md cursor-pointer text-sm font-medium transition-all select-none ${
											format === "png"
												? "bg-primary/20 text-primary border border-primary/40 shadow-sm shadow-primary/10"
												: "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
										}`}
									>
										<input
											type="radio"
											name="format"
											value="png"
											checked={format === "png"}
											onChange={() => setFormat("png")}
											className="sr-only"
										/>
										PNG
									</label>
									<label
										className={`flex-1 md:flex-none inline-flex items-center justify-center py-2.5 md:py-2 px-5 rounded-md cursor-pointer text-sm font-medium transition-all select-none ${
											format === "svg"
												? "bg-primary/20 text-primary border border-primary/40 shadow-sm shadow-primary/10"
												: "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
										}`}
									>
										<input
											type="radio"
											name="format"
											value="svg"
											checked={format === "svg"}
											onChange={() => setFormat("svg")}
											className="sr-only"
										/>
										SVG
									</label>
								</div>
							</div>

							{format === "png" && (
								<div className="mb-4">
									<span
										id={sizeGroupId}
										className="block text-muted-foreground text-sm mb-2"
									>
										{t("imageGenerator.outputSize")}
									</span>
									<div
										className="grid grid-cols-2 md:grid-cols-4 gap-2"
										role="radiogroup"
										aria-labelledby={sizeGroupId}
									>
										{SCALE_OPTIONS.map((option, index) => {
											const isHighRes = index >= 2;
											return (
												<label
													key={option.value}
													className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-lg cursor-pointer transition-all select-none ${
														scale === option.value
															? "bg-primary/20 text-primary border border-primary/50"
															: isHighRes
																? "bg-secondary/20 text-muted-foreground hover:bg-secondary/40 hover:text-foreground/80 border border-transparent"
																: "bg-secondary/40 text-foreground/90 hover:bg-secondary/60 hover:text-foreground border border-transparent"
													}`}
												>
													<input
														type="radio"
														name="scale"
														value={option.value}
														checked={scale === option.value}
														onChange={() => setScale(option.value)}
														className="sr-only"
													/>
													<span
														className={`font-semibold ${isHighRes ? "text-sm" : "text-base"}`}
													>
														{option.label}
													</span>
													<span
														className={`text-muted-foreground mt-0.5 ${isHighRes ? "text-[10px]" : "text-xs"}`}
													>
														{option.size}
													</span>
												</label>
											);
										})}
									</div>
								</div>
							)}

							<div className="mb-4">
								<label className="flex items-center gap-2.5 text-muted-foreground text-sm cursor-pointer hover:text-foreground transition-colors">
									<input
										type="checkbox"
										checked={showTitle}
										onChange={(e) => setShowTitle(e.target.checked)}
										className="w-4 h-4 rounded border-border accent-primary"
									/>
									{t("imageGenerator.showBoardName")}
								</label>
							</div>

							{error && (
								<div className="mt-2 p-3 bg-destructive/10 border border-destructive/40 rounded-lg flex items-center gap-2">
									<span className="text-base">⚠️</span>
									<span className="text-destructive text-sm">{error}</span>
								</div>
							)}
						</div>

						<div className="flex flex-col gap-2 border-t lg:border-t-0 lg:border-l border-border pt-6 mt-4 lg:pt-0 lg:mt-0 lg:pl-8">
							{generatedUrl ? (
								<>
									<div className="mb-4">
										<div className="flex items-center justify-between mb-3 border-b border-border">
											<div className="flex gap-1">
												<button
													type="button"
													className={`px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium transition-colors relative ${
														previewMode === "preview"
															? "text-primary"
															: "text-muted-foreground hover:text-foreground"
													}`}
													onClick={() => setPreviewMode("preview")}
												>
													{t("imageGenerator.previewTab")}
													{previewMode === "preview" && (
														<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
													)}
												</button>
												<button
													type="button"
													className={`px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium transition-colors relative ${
														previewMode === "actual"
															? "text-primary"
															: "text-muted-foreground hover:text-foreground"
													}`}
													onClick={() => setPreviewMode("actual")}
												>
													{t("imageGenerator.actualImageTab")}
													{previewMode === "actual" && (
														<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
													)}
												</button>
											</div>
											<div className="flex items-center gap-2 mb-1">
												<button
													type="button"
													className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 rounded-lg transition-all"
													onClick={handleDownloadImage}
												>
													<Download className="w-3.5 h-3.5" />
													{t("imageGenerator.downloadImage")}
												</button>
												<button
													type="button"
													className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 rounded-lg transition-all"
													onClick={handleEditInEditor}
												>
													<Pencil className="w-3.5 h-3.5" />
													{t("imageGenerator.editInEditor")}
												</button>
											</div>
										</div>
										<div className="bg-secondary/30 rounded-lg p-2 md:p-4 flex justify-center items-center min-h-[150px] md:min-h-[200px] lg:min-h-[280px] overflow-auto border border-border/50">
											{previewMode === "preview" ? (
												boardData && (
													<BoardPreview
														boardData={boardData}
														showTitle={showTitle}
													/>
												)
											) : imageLoadError ? (
												<div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
													<span className="text-4xl mb-3">⚠️</span>
													<p className="text-sm text-center mb-4">
														{t("imageGenerator.imageLoadError")}
													</p>
													<button
														type="button"
														className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-4 py-2 rounded-lg text-sm font-medium transition-all"
														onClick={() => setImageLoadError(false)}
													>
														{t("imageGenerator.retry")}
													</button>
												</div>
											) : (
												<img
													src={generatedUrl}
													alt={strategyBoardAlt}
													className="max-w-full max-h-[400px] rounded"
													onError={() => setImageLoadError(true)}
													onLoad={() => setImageLoadError(false)}
												/>
											)}
										</div>
									</div>

									<div className="mb-4">
										<div className="flex items-center justify-between mb-2">
											<label
												htmlFor={generatedUrlId}
												className="text-muted-foreground text-sm"
											>
												{t("imageGenerator.generatedUrl")}
											</label>
											<button
												type="button"
												className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
													copied
														? "bg-green-500/20 text-green-400"
														: "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
												}`}
												onClick={copyToClipboard}
											>
												{copied ? (
													<Check className="w-3 h-3" />
												) : (
													<Copy className="w-3 h-3" />
												)}
												{t("common.copy")}
											</button>
										</div>
										<input
											id={generatedUrlId}
											type="text"
											className="w-full p-3 bg-secondary/30 border border-border rounded-lg text-foreground text-xs font-mono focus:outline-none"
											value={generatedUrl}
											readOnly
										/>
										{featureFlags.shortLinksEnabled && (
											<label className="flex items-center gap-2 mt-2 cursor-pointer text-sm">
												<input
													type="checkbox"
													checked={useShortUrl}
													onChange={(e) =>
														handleShortUrlChange(e.target.checked)
													}
													disabled={isGeneratingShortUrl || !generatedUrl}
													className="w-4 h-4 rounded accent-accent disabled:opacity-50"
												/>
												<span
													className={
														isGeneratingShortUrl || !generatedUrl
															? "text-muted-foreground"
															: "text-foreground"
													}
												>
													{isGeneratingShortUrl ? (
														<span className="flex items-center gap-1.5">
															<Loader2 className="w-3 h-3 animate-spin" />
															{t("imageGenerator.shortenUrl")}
														</span>
													) : (
														t("imageGenerator.shortenUrl")
													)}
												</span>
											</label>
										)}
									</div>

									<div className="mb-4">
										<div className="flex items-center justify-between mb-2">
											<span className="text-muted-foreground text-sm">
												HTML
											</span>
											<button
												type="button"
												className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
													copiedHtml
														? "bg-green-500/20 text-green-400"
														: "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
												}`}
												onClick={async () => {
													const htmlCode = `<img src="${generatedUrl}" alt="${strategyBoardAlt}" />`;
													await navigator.clipboard.writeText(htmlCode);
													setCopiedHtml(true);
													setTimeout(
														() => setCopiedHtml(false),
														COPY_FEEDBACK_DURATION,
													);
												}}
											>
												{copiedHtml ? (
													<Check className="w-3 h-3" />
												) : (
													<Copy className="w-3 h-3" />
												)}
												{t("common.copy")}
											</button>
										</div>
										<code className="block p-3 bg-secondary/30 border border-border rounded-lg text-accent text-xs font-mono overflow-x-auto break-all">
											{`<img src="${generatedUrl}" alt="${strategyBoardAlt}" />`}
										</code>
									</div>

									<div>
										<div className="flex items-center justify-between mb-2">
											<span className="text-muted-foreground text-sm">
												Markdown
											</span>
											<button
												type="button"
												className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
													copiedMarkdown
														? "bg-green-500/20 text-green-400"
														: "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
												}`}
												onClick={async () => {
													const markdownCode = `![${strategyBoardAlt}](${generatedUrl})`;
													await navigator.clipboard.writeText(markdownCode);
													setCopiedMarkdown(true);
													setTimeout(
														() => setCopiedMarkdown(false),
														COPY_FEEDBACK_DURATION,
													);
												}}
											>
												{copiedMarkdown ? (
													<Check className="w-3 h-3" />
												) : (
													<Copy className="w-3 h-3" />
												)}
												{t("common.copy")}
											</button>
										</div>
										<code className="block p-3 bg-secondary/30 border border-border rounded-lg text-accent text-xs font-mono overflow-x-auto break-all">
											{`![${strategyBoardAlt}](${generatedUrl})`}
										</code>
									</div>
								</>
							) : (
								<div className="flex flex-col items-center justify-center bg-secondary/20 border border-border/50 rounded-lg p-8 md:p-12 min-h-[200px] lg:min-h-[300px] text-muted-foreground">
									<img
										src="/favicon.svg"
										alt="STGY Tools"
										className="w-16 h-16 mb-4 opacity-30"
									/>
									<p className="text-sm text-center">
										{t("imageGenerator.enterCodeToPreview")}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<Footer />
		</div>
	);
}
