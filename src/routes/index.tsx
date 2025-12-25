import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Check, Link, Loader2, Pencil } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BoardViewer } from "@/components/board";
import { AppHeader } from "@/components/ui/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Footer } from "@/components/ui/Footer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ObjectListPanel } from "@/components/viewer/ObjectListPanel";
import {
	generateCanonicalLink,
	generateHreflangLinks,
	PAGE_SEO,
	SITE_CONFIG,
} from "@/lib/seo";
import { getFeatureFlagsFn } from "@/lib/server/featureFlags";
import {
	createShortLinkFn,
	resolveShortIdFn,
} from "@/lib/server/shortLinks/serverFn";
import type { BoardData, BoardObject } from "@/lib/stgy";
import { decodeStgy, ObjectNames, parseBoardData } from "@/lib/stgy";

export const Route = createFileRoute("/")({
	component: App,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			stgy: typeof search.stgy === "string" ? search.stgy : undefined,
			s: typeof search.s === "string" ? search.s : undefined,
		};
	},
	loaderDeps: ({ search }) => ({ s: search.s, stgy: search.stgy }),
	loader: async ({ deps }) => {
		// Feature Flagsを取得
		const featureFlags = await getFeatureFlagsFn();

		if (deps.stgy) {
			return { resolvedStgy: deps.stgy, shortId: undefined, featureFlags };
		}
		if (deps.s) {
			const result = await resolveShortIdFn({ data: { shortId: deps.s } });
			if (!result) {
				throw notFound();
			}
			return { resolvedStgy: result.stgy, shortId: deps.s, featureFlags };
		}
		return { resolvedStgy: undefined, shortId: undefined, featureFlags };
	},
	head: ({ match, loaderData }) => {
		const { stgy, s } = match.search;
		// 短縮IDの場合はloaderDataから解決済みのstgyを取得
		const resolvedStgy = loaderData?.resolvedStgy ?? stgy;
		const hasCode = Boolean(resolvedStgy);
		const pagePath = PAGE_SEO.home.path;

		// 動的OGイメージ: stgyコードがある場合は生成画像を使用
		// 短縮IDがある場合はそれを使用（OGP用に短いURL）
		const ogImage = hasCode
			? s
				? `${SITE_CONFIG.url}/image?s=${encodeURIComponent(s)}`
				: `${SITE_CONFIG.url}/image?stgy=${encodeURIComponent(resolvedStgy as string)}`
			: `${SITE_CONFIG.url}/favicon.svg`;

		// Twitter Cardタイプ: 画像がある場合はsummary_large_image
		const twitterCard = hasCode ? "summary_large_image" : "summary";

		return {
			meta: [
				{
					title: PAGE_SEO.home.title,
				},
				{
					name: "description",
					content: PAGE_SEO.home.description,
				},
				{
					name: "keywords",
					content:
						"FFXIV, Final Fantasy XIV, Strategy Board, stgy, viewer, raid strategy, FF14",
				},
				// Open Graph
				{
					property: "og:title",
					content: "FFXIV Strategy Board Viewer",
				},
				{
					property: "og:description",
					content: hasCode
						? "View this FFXIV Strategy Board diagram"
						: "View and decode FFXIV Strategy Board (stgy) codes. Visualize raid strategies with interactive SVG rendering.",
				},
				{
					property: "og:type",
					content: "website",
				},
				{
					property: "og:url",
					content: `${SITE_CONFIG.url}${pagePath}`,
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
				// Twitter Card
				{
					name: "twitter:card",
					content: twitterCard,
				},
				{
					name: "twitter:title",
					content: "FFXIV Strategy Board Viewer",
				},
				{
					name: "twitter:description",
					content: hasCode
						? "View this FFXIV Strategy Board diagram"
						: "View and decode FFXIV Strategy Board (stgy) codes.",
				},
				{
					name: "twitter:image",
					content: ogImage,
				},
			],
			links: [
				generateCanonicalLink(pagePath),
				...generateHreflangLinks(pagePath),
			],
		};
	},
});

const SAMPLE_STGY =
	"[stgy:a7AIxEt68bIksM7YvDMlkmKJL8iH2Eq-2vDUI+1PGMl9+UVD4FhAcsxS5tImN8GsSsHqSfbiqbA-P+yOUQ9unhordXjeMGL9gogzDY+BIgOtPiufNvO85+QJQtQ0HoGATs4AS6KNbAfZ0mBO0j7Xyr7DzEG8fCafOqcmj1p4mq-RTUxIVf5RqM+0GuS+XSB9CIBbHIKJoW3OvB8GEo0Z9+6TbKxdVBGwL5FY53igor8+TrbL7P2mEZwElDFDgDrmoxRYo-tH36+ipeUTp]";

/** デバウンス遅延時間 (ms) */
const DEBOUNCE_DELAY = 300;

function App() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { stgy: searchStgy, s: shortId } = Route.useSearch();
	const { resolvedStgy, featureFlags } = Route.useLoaderData();

	// 初期コード: loader で解決されたstgyを優先
	const initialCode = resolvedStgy ?? searchStgy;

	// サンプルコードを使用しているかどうか（URL更新をスキップするため）
	const [isUsingDefaultSample, setIsUsingDefaultSample] = useState(
		!initialCode,
	);
	const [stgyInput, setStgyInput] = useState(initialCode ?? SAMPLE_STGY);

	// 短縮IDで開いた場合は初回のみstgyに展開してURLを更新
	const hasInitialized = useRef(false);
	useEffect(() => {
		if (!hasInitialized.current && resolvedStgy && shortId) {
			setStgyInput(resolvedStgy);
			setIsUsingDefaultSample(false);
			hasInitialized.current = true;

			// URLを ?s=xxx から ?stgy=xxx に置き換え
			const url = new URL(window.location.href);
			url.searchParams.delete("s");
			url.searchParams.set("stgy", resolvedStgy);
			window.history.replaceState(null, "", url.toString());
		}
	}, [resolvedStgy, shortId]);
	const [boardData, setBoardData] = useState<BoardData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showBoundingBox, setShowBoundingBox] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [selectedObject, setSelectedObject] = useState<BoardObject | null>(
		null,
	);
	const stgyInputId = useId();
	const showBboxId = useId();
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// 短縮リンク生成
	const [isGeneratingShortLink, setIsGeneratingShortLink] = useState(false);
	const [copiedShortLink, setCopiedShortLink] = useState(false);

	// Editorで編集ボタンのハンドラー
	const handleEditInEditor = useCallback(() => {
		if (!stgyInput.trim() || !boardData) return;
		navigate({ to: "/editor", search: { stgy: stgyInput.trim() } });
	}, [stgyInput, boardData, navigate]);

	// 短縮リンク生成ハンドラー
	const handleGenerateShortLink = useCallback(async () => {
		if (!stgyInput.trim() || !boardData) return;
		setIsGeneratingShortLink(true);
		setCopiedShortLink(false);
		try {
			const baseUrl = window.location.origin;
			const result = await createShortLinkFn({
				data: { stgy: stgyInput.trim(), baseUrl },
			});
			if (result.success && result.data.url) {
				await navigator.clipboard.writeText(result.data.url);
				setCopiedShortLink(true);
				setTimeout(() => setCopiedShortLink(false), 2000);
			}
		} finally {
			setIsGeneratingShortLink(false);
		}
	}, [stgyInput, boardData]);

	// 入力変更ハンドラー（サンプルコードフラグを更新）
	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newValue = e.target.value;
			setStgyInput(newValue);
			// ユーザーが入力を変更したらサンプルコードフラグをオフ
			if (isUsingDefaultSample) {
				setIsUsingDefaultSample(false);
			}
		},
		[isUsingDefaultSample],
	);

	// 自動デコード関数
	const decodeBoardData = useCallback((input: string) => {
		if (!input.trim()) {
			setBoardData(null);
			setError(null);
			setSelectedIndex(null);
			setSelectedObject(null);
			return;
		}

		try {
			setError(null);
			const binary = decodeStgy(input.trim());
			const data = parseBoardData(binary);
			setBoardData(data);
			setSelectedIndex(null);
			setSelectedObject(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Unknown error");
			setBoardData(null);
		}
	}, []);

	// 入力変更時の自動デコード＆URL更新（デバウンス付き）
	useEffect(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			decodeBoardData(stgyInput);

			// サンプルコード使用時はURLを更新しない
			if (!isUsingDefaultSample) {
				const trimmedCode = stgyInput.trim();
				const url = new URL(window.location.href);
				if (trimmedCode) {
					url.searchParams.set("stgy", trimmedCode);
				} else {
					url.searchParams.delete("stgy");
				}
				window.history.replaceState(null, "", url.toString());
			}
		}, DEBOUNCE_DELAY);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [stgyInput, decodeBoardData, isUsingDefaultSample]);

	const handleSelectObject = (
		index: number | null,
		object: BoardObject | null,
	) => {
		setSelectedIndex(index);
		setSelectedObject(object);
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<AppHeader currentPage="viewer" title={t("viewer.pageTitle")} />

			<main className="p-4 max-w-6xl mx-auto">
				<div className="mb-6 space-y-3">
					<Label htmlFor={stgyInputId}>{t("viewer.inputLabel")}</Label>
					<Textarea
						id={stgyInputId}
						value={stgyInput}
						onChange={handleInputChange}
						className="h-24 font-mono text-sm"
						placeholder={t("viewer.inputPlaceholder")}
					/>
				</div>

				{error && (
					<div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>{error}</p>
					</div>
				)}

				{boardData && (
					<div className="space-y-4">
						{/* ボード情報 */}
						<div className="p-4 bg-card border border-border rounded-lg">
							<div className="flex items-center justify-between mb-3">
								<h2 className="text-lg font-semibold font-display">
									{t("viewer.boardInfo.title")}
								</h2>
								<div className="flex items-center gap-2">
									{featureFlags.shortLinksEnabled && (
										<button
											type="button"
											className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
											onClick={handleGenerateShortLink}
											disabled={isGeneratingShortLink}
											title={t("viewer.shortLink.generate")}
										>
											{isGeneratingShortLink ? (
												<Loader2 className="w-3.5 h-3.5 animate-spin" />
											) : copiedShortLink ? (
												<Check className="w-3.5 h-3.5" />
											) : (
												<Link className="w-3.5 h-3.5" />
											)}
											{copiedShortLink
												? t("viewer.shortLink.copied")
												: t("viewer.shortLink.generate")}
										</button>
									)}
									<button
										type="button"
										className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 rounded-lg transition-all"
										onClick={handleEditInEditor}
									>
										<Pencil className="w-3.5 h-3.5" />
										{t("imageGenerator.editInEditor")}
									</button>
								</div>
							</div>
							<dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
								<div>
									<dt className="text-muted-foreground">
										{t("viewer.boardInfo.name")}
									</dt>
									<dd className="font-medium">
										{boardData.name || t("viewer.boardInfo.unnamed")}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">
										{t("viewer.boardInfo.objectCount")}
									</dt>
									<dd className="font-medium font-mono text-primary">
										{boardData.objects.length}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">
										{t("viewer.boardInfo.background")}
									</dt>
									<dd className="font-medium">
										{t(`background.${boardData.backgroundId}`)}
									</dd>
								</div>
							</dl>
						</div>

						<div className="flex gap-4 flex-col xl:flex-row">
							{/* オブジェクト一覧 */}
							<div className="w-full xl:w-[220px] h-[300px] xl:h-[420px] flex-shrink-0">
								<ObjectListPanel
									objects={boardData.objects}
									selectedIndex={selectedIndex}
									onSelectObject={handleSelectObject}
								/>
							</div>

							{/* ボードビューアー */}
							<div className="p-4 bg-card border border-border rounded-lg flex-shrink-0">
								<div className="mb-3 flex items-center gap-2">
									<Checkbox
										id={showBboxId}
										checked={showBoundingBox}
										onCheckedChange={(checked) =>
											setShowBoundingBox(checked === true)
										}
									/>
									<Label
										htmlFor={showBboxId}
										className="text-sm cursor-pointer"
									>
										{t("viewer.showBoundingBox")}
									</Label>
								</div>
								<BoardViewer
									boardData={boardData}
									scale={1}
									showBoundingBox={showBoundingBox}
									selectedIndex={selectedIndex}
									onSelectObject={handleSelectObject}
								/>
							</div>

							{/* 選択オブジェクト情報 */}
							<div className="p-4 bg-card border border-border rounded-lg flex-1 min-w-[250px]">
								<h2 className="text-lg font-semibold mb-3 font-display">
									{t("viewer.selectedObject.title")}
								</h2>
								{selectedObject && selectedIndex !== null ? (
									<SelectedObjectInfo
										index={selectedIndex}
										object={selectedObject}
									/>
								) : (
									<p className="text-muted-foreground text-sm">
										{t("viewer.selectedObject.clickToSelect")}
									</p>
								)}
							</div>
						</div>
					</div>
				)}
			</main>

			<Footer />
		</div>
	);
}

function SelectedObjectInfo({
	index,
	object,
}: {
	index: number;
	object: BoardObject;
}) {
	const { t } = useTranslation();
	const objectName =
		t(`object.${object.objectId}`, { defaultValue: "" }) ||
		ObjectNames[object.objectId] ||
		t("viewer.selectedObject.unknown");

	return (
		<dl className="space-y-2 text-sm">
			<div className="flex justify-between">
				<dt className="text-muted-foreground">
					{t("viewer.selectedObject.index")}
				</dt>
				<dd className="font-mono">{index}</dd>
			</div>
			<div className="flex justify-between">
				<dt className="text-muted-foreground">
					{t("viewer.selectedObject.objectName")}
				</dt>
				<dd className="font-medium">{objectName}</dd>
			</div>
			<div className="flex justify-between">
				<dt className="text-muted-foreground">
					{t("viewer.selectedObject.objectId")}
				</dt>
				<dd className="font-mono text-primary">{object.objectId}</dd>
			</div>
			<div className="flex justify-between">
				<dt className="text-muted-foreground">
					{t("viewer.selectedObject.position")}
				</dt>
				<dd className="font-mono">
					({object.position.x.toFixed(1)}, {object.position.y.toFixed(1)})
				</dd>
			</div>
			<div className="flex justify-between">
				<dt className="text-muted-foreground">
					{t("viewer.selectedObject.rotation")}
				</dt>
				<dd className="font-mono">{object.rotation}°</dd>
			</div>
			<div className="flex justify-between">
				<dt className="text-muted-foreground">
					{t("viewer.selectedObject.size")}
				</dt>
				<dd className="font-mono">{object.size}%</dd>
			</div>
			<div className="flex justify-between items-center">
				<dt className="text-muted-foreground">
					{t("viewer.selectedObject.color")}
				</dt>
				<dd className="font-mono flex items-center gap-2">
					<span
						className="inline-block w-4 h-4 rounded border border-border"
						style={{
							backgroundColor: `rgba(${object.color.r}, ${object.color.g}, ${object.color.b}, ${1 - object.color.opacity / 100})`,
						}}
					/>
					RGB({object.color.r}, {object.color.g}, {object.color.b})
				</dd>
			</div>
			{object.text && (
				<div className="flex justify-between">
					<dt className="text-muted-foreground">
						{t("viewer.selectedObject.text")}
					</dt>
					<dd className="font-mono">"{object.text}"</dd>
				</div>
			)}
			{object.param1 !== undefined && (
				<div className="flex justify-between">
					<dt className="text-muted-foreground">
						{t("viewer.selectedObject.param1")}
					</dt>
					<dd className="font-mono">{object.param1}</dd>
				</div>
			)}
			{object.param2 !== undefined && (
				<div className="flex justify-between">
					<dt className="text-muted-foreground">
						{t("viewer.selectedObject.param2")}
					</dt>
					<dd className="font-mono">{object.param2}</dd>
				</div>
			)}
			<div className="pt-2 border-t border-border">
				<dt className="text-muted-foreground mb-2">
					{t("viewer.selectedObject.flags")}
				</dt>
				<dd className="flex flex-wrap gap-1">
					{object.flags.visible && (
						<Badge
							variant="outline"
							className="bg-green-500/10 text-green-400 border-green-500/30"
						>
							{t("viewer.flags.visible")}
						</Badge>
					)}
					{object.flags.flipHorizontal && (
						<Badge
							variant="outline"
							className="bg-blue-500/10 text-blue-400 border-blue-500/30"
						>
							{t("viewer.flags.flipHorizontal")}
						</Badge>
					)}
					{object.flags.flipVertical && (
						<Badge
							variant="outline"
							className="bg-blue-500/10 text-blue-400 border-blue-500/30"
						>
							{t("viewer.flags.flipVertical")}
						</Badge>
					)}
					{object.flags.locked && (
						<Badge
							variant="outline"
							className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
						>
							{t("viewer.flags.locked")}
						</Badge>
					)}
				</dd>
			</div>
		</dl>
	);
}
