import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import {
	AlertCircle,
	Check,
	Copy,
	Link,
	Loader2,
	Maximize2,
	Pencil,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { BoardViewer } from "@/components/board";
import { AppHeader } from "@/components/ui/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/ui/Footer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BoardExpandModal } from "@/components/viewer/BoardExpandModal";
import { CreateGroupDialog } from "@/components/viewer/CreateGroupDialog";
import { DeleteGroupDialog } from "@/components/viewer/DeleteGroupDialog";
import { EditKeyDialog } from "@/components/viewer/EditKeyDialog";
import { GroupHistoryDialog } from "@/components/viewer/GroupHistoryDialog";
import { GroupInfoBanner } from "@/components/viewer/GroupInfoBanner";
import { ObjectListPanel } from "@/components/viewer/ObjectListPanel";
import { ViewerGrid } from "@/components/viewer/ViewerGrid";
import { ViewerTabs } from "@/components/viewer/ViewerTabs";
import { ViewerToolbar } from "@/components/viewer/ViewerToolbar";
import {
	generateCanonicalLink,
	generateHreflangLinks,
	getLocalizedSeo,
	SITE_CONFIG,
} from "@/lib/seo";
import { getFeatureFlagsFn } from "@/lib/server/featureFlags";
import {
	clearCachedGroup,
	getCachedGroup,
} from "@/lib/server/shortLinks/createdGroupCache";
import { isValidStgyCode } from "@/lib/server/shortLinks/idGenerator";
import {
	createShortLinkFn,
	getGroupHistoryFn,
	resolveGroupIdFn,
	resolveShortIdFn,
} from "@/lib/server/shortLinks/serverFn";
import type { BoardObject } from "@/lib/stgy";
import { ObjectNames } from "@/lib/stgy";
import {
	type GroupInfo,
	MAX_BOARDS,
	parseMultipleStgyCodes,
	useGroupEdit,
	useViewerActions,
	useViewerActiveBoard,
	useViewerActiveSelection,
	useViewerBoardCount,
	useViewerBoards,
	useViewerMode,
	ViewerStoreProvider,
} from "@/lib/viewer";

export const Route = createFileRoute("/")({
	component: App,
	validateSearch: (search: Record<string, unknown>) => {
		// stgy and s can be single values or arrays
		const parseStringOrArray = (
			value: unknown,
		): string | string[] | undefined => {
			if (typeof value === "string") return value;
			if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
				return value as string[];
			}
			return undefined;
		};

		return {
			stgy: parseStringOrArray(search.stgy),
			s: parseStringOrArray(search.s),
			g: typeof search.g === "string" ? search.g : undefined,
			v:
				typeof search.v === "string" || typeof search.v === "number"
					? Number(search.v)
					: undefined,
			lang: typeof search.lang === "string" ? search.lang : undefined,
			mode:
				search.mode === "tab" || search.mode === "grid"
					? search.mode
					: undefined,
			active: typeof search.active === "number" ? search.active : undefined,
		};
	},
	loaderDeps: ({ search }) => ({
		s: search.s,
		stgy: search.stgy,
		g: search.g,
		v: search.v,
	}),
	loader: async ({ deps }) => {
		const featureFlags = await getFeatureFlagsFn();

		const normalizeToArray = (
			value: string | string[] | undefined,
		): string[] => {
			if (!value) return [];
			return Array.isArray(value) ? value : [value];
		};

		// Handle group parameter (takes precedence)
		if (deps.g) {
			const groupData = await resolveGroupIdFn({ data: { groupId: deps.g } });
			if (groupData) {
				// Check if viewing a specific past version
				if (deps.v !== undefined) {
					// Validate version parameter
					if (
						!Number.isInteger(deps.v) ||
						deps.v < 1 ||
						deps.v >= groupData.version
					) {
						// Invalid or non-existent version - show current with error
						return {
							resolvedStgyCodes: groupData.stgyCodes,
							shortIds: undefined,
							groupInfo: {
								name: groupData.name,
								description: groupData.description,
								version: groupData.version,
								versionNotFound: true,
							} satisfies GroupInfo,
							groupNotFound: false,
							featureFlags,
						};
					}

					const history = await getGroupHistoryFn({
						data: { groupId: deps.g },
					});
					const versionData = history?.find((h) => h.version === deps.v);
					if (versionData) {
						return {
							resolvedStgyCodes: versionData.stgyCodes,
							shortIds: undefined,
							groupInfo: {
								name: versionData.name,
								description: versionData.description,
								version: versionData.version,
								currentVersion: groupData.version,
								isPastVersion: true,
							} satisfies GroupInfo,
							groupNotFound: false,
							featureFlags,
						};
					}

					// Version not found in history - show current with error
					return {
						resolvedStgyCodes: groupData.stgyCodes,
						shortIds: undefined,
						groupInfo: {
							name: groupData.name,
							description: groupData.description,
							version: groupData.version,
							versionNotFound: true,
						} satisfies GroupInfo,
						groupNotFound: false,
						featureFlags,
					};
				}

				return {
					resolvedStgyCodes: groupData.stgyCodes,
					shortIds: undefined,
					groupInfo: {
						name: groupData.name,
						description: groupData.description,
						version: groupData.version,
					} satisfies GroupInfo,
					groupNotFound: false,
					featureFlags,
				};
			}
			// Group not found - show error on viewer page
			return {
				resolvedStgyCodes: [],
				shortIds: undefined,
				groupInfo: undefined,
				groupNotFound: true,
				featureFlags,
			};
		}

		const stgyCodes = normalizeToArray(deps.stgy);
		const shortIds = normalizeToArray(deps.s);

		const resolvedFromShortIds = await Promise.all(
			shortIds.map(async (shortId) => {
				const result = await resolveShortIdFn({ data: { shortId } });
				return result?.stgy ?? null;
			}),
		);

		// Combine all resolved stgy codes (direct stgy params + resolved short IDs)
		const allStgyCodes = [
			...stgyCodes,
			...resolvedFromShortIds.filter((s): s is string => s !== null),
		];

		const hasUnresolvedShortId =
			shortIds.length > 0 &&
			resolvedFromShortIds.some((s) => s === null) &&
			allStgyCodes.length === 0;

		if (hasUnresolvedShortId) {
			throw notFound();
		}

		return {
			resolvedStgyCodes: allStgyCodes,
			shortIds: shortIds.length > 0 ? shortIds : undefined,
			groupInfo: undefined as GroupInfo | undefined,
			groupNotFound: false,
			featureFlags,
		};
	},
	head: ({ match, loaderData }) => {
		const { stgy, s, lang } = match.search;
		// Use the first element when array (for OGP)
		const firstStgy = Array.isArray(stgy) ? stgy[0] : stgy;
		const firstShortId = Array.isArray(s) ? s[0] : s;
		const resolvedStgyCodes = loaderData?.resolvedStgyCodes ?? [];
		const groupInfo = loaderData?.groupInfo;
		const resolvedStgy = resolvedStgyCodes[0] ?? firstStgy;
		const hasCode = Boolean(resolvedStgy);
		const seo = getLocalizedSeo("home", lang);

		// Dynamic OG image: use generated image when stgy code exists; prefer short ID for shorter URLs
		const ogImage = hasCode
			? firstShortId
				? `${SITE_CONFIG.url}/image?s=${encodeURIComponent(firstShortId)}`
				: `${SITE_CONFIG.url}/image?stgy=${encodeURIComponent(resolvedStgy as string)}`
			: `${SITE_CONFIG.url}/favicon.svg`;

		// Twitter Card type: use summary_large_image when image exists
		const twitterCard = hasCode ? "summary_large_image" : "summary";

		// Dynamic OG title/description based on group info or board count
		const boardCount = resolvedStgyCodes.length;
		const ogTitle = groupInfo ? `${groupInfo.name} | ${seo.title}` : seo.title;
		const ogDescription = groupInfo?.description
			? groupInfo.description
			: hasCode
				? seo.lang === "ja"
					? boardCount > 1
						? `${boardCount}件のFFXIV ストラテジーボードダイアグラムを表示`
						: "FFXIV ストラテジーボードのダイアグラムを表示"
					: boardCount > 1
						? `View ${boardCount} FFXIV Strategy Board diagrams`
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
						"FFXIV, Final Fantasy XIV, Strategy Board, stgy, viewer, raid strategy, FF14",
				},
				// Open Graph
				{
					property: "og:title",
					content: ogTitle,
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
					content: ogTitle,
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

const SAMPLE_STGY =
	"[stgy:ag40qa9YRyTPXZgVoFg1PhfYFKZPnDzJzfLyt51cHDkEEDia+PwMEbq7od+fEJ186kZxqHZSMHPrEWXPrSypGr47NcAkRTNWvNc4OQ8QPYGychElb-BvEZo+Os2dqLJFN5bLGkAn9j6mR4eNSYvA+eu-Zar0FYE3f+Zwa8nty3QUC86FlycOdOJ8vxFWYJmHZ0tDKEDcrVmRZol1QuWNRmlqVyTQbcN-m6t1S4EohXk05l6LzIfdDuS4rKemSgCMDOWI0]";

/** Debounce delay in ms */
const DEBOUNCE_DELAY = 300;

function App() {
	const { mode, g: groupId } = Route.useSearch();
	const { resolvedStgyCodes, groupInfo, groupNotFound } = Route.useLoaderData();

	// Check for cached group data (handles KV propagation delay)
	const cachedGroup = useMemo(() => {
		if (groupId && !groupInfo && groupNotFound) {
			return getCachedGroup(groupId);
		}
		return null;
	}, [groupId, groupInfo, groupNotFound]);

	const initialBoards = useMemo(() => {
		// Use cached stgyCodes if KV data not available
		if (cachedGroup && cachedGroup.stgyCodes.length > 0) {
			return parseMultipleStgyCodes(cachedGroup.stgyCodes.join("\n"));
		}
		if (resolvedStgyCodes.length > 0) {
			return parseMultipleStgyCodes(resolvedStgyCodes.join("\n"));
		}
		return [];
	}, [resolvedStgyCodes, cachedGroup]);

	const hasInitialCode = resolvedStgyCodes.length > 0 || !!cachedGroup;

	// Don't show "not found" if we have cached data
	const effectiveGroupNotFound = groupNotFound && !cachedGroup;

	const initialViewMode =
		mode === "tab" ? "tab" : initialBoards.length === 1 ? "tab" : "grid";

	return (
		<ViewerStoreProvider
			initialBoards={initialBoards}
			initialViewMode={initialViewMode}
		>
			<ViewerContent
				hasInitialCode={hasInitialCode}
				groupInfo={groupInfo}
				groupNotFound={effectiveGroupNotFound}
			/>
		</ViewerStoreProvider>
	);
}

function ViewerContent({
	hasInitialCode,
	groupInfo: loaderGroupInfo,
	groupNotFound,
}: {
	hasInitialCode: boolean;
	groupInfo?: GroupInfo;
	groupNotFound: boolean;
}) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { featureFlags } = Route.useLoaderData();
	const { shortIds } = Route.useLoaderData();
	const { g: groupId } = Route.useSearch();

	// Use cached group data as fallback when KV hasn't propagated yet
	const groupInfo = useMemo(() => {
		if (loaderGroupInfo) {
			// KV data available - clear cache if any
			if (groupId) {
				clearCachedGroup(groupId);
			}
			return loaderGroupInfo;
		}
		// Try to get from cache (handles KV propagation delay)
		if (groupId) {
			const cached = getCachedGroup(groupId);
			if (cached) {
				return {
					name: cached.name,
					description: cached.description,
					version: cached.version,
				} satisfies GroupInfo;
			}
		}
		return undefined;
	}, [loaderGroupInfo, groupId]);

	// Construct group URL for sharing
	const groupUrl = groupId
		? `${window.location.origin}/?g=${groupId}`
		: undefined;

	const boards = useViewerBoards();
	const activeBoard = useViewerActiveBoard();
	const boardCount = useViewerBoardCount();
	const viewMode = useViewerMode();
	const { objectId: selectedObjectId, object: selectedObject } =
		useViewerActiveSelection();
	const actions = useViewerActions();

	const [stgyInput, setStgyInput] = useState(() =>
		boards.map((b) => b.stgyCode).join("\n"),
	);
	// Whether to sync state to URL (only enabled when initial code exists, but NOT for group views)
	const [shouldUpdateUrl, setShouldUpdateUrl] = useState(
		hasInitialCode && !groupInfo,
	);
	const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
	const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
	const stgyInputId = useId();
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Group edit hook
	const stgyCodesForEdit = useMemo(
		() =>
			stgyInput
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.length > 0),
		[stgyInput],
	);

	const groupEdit = useGroupEdit({
		groupId,
		groupInfo,
		stgyCodes: stgyCodesForEdit,
		onSaveSuccess: (newStgyCodes) => {
			actions.loadBoards(newStgyCodes.join("\n"));
		},
		onCancelReset: () => {
			setStgyInput(boards.map((b) => b.stgyCode).join("\n"));
			return boards.map((b) => b.stgyCode);
		},
	});

	// Replace ?s=xxx with ?stgy=xxx on initial load when opened via short ID
	const hasInitialized = useRef(false);
	useEffect(() => {
		if (!hasInitialized.current && shortIds && shortIds.length > 0) {
			hasInitialized.current = true;
			const url = new URL(window.location.href);
			url.searchParams.delete("s");
			for (const board of boards) {
				if (board.stgyCode) {
					url.searchParams.append("stgy", board.stgyCode);
				}
			}
			window.history.replaceState(null, "", url.toString());
		}
	}, [shortIds, boards]);

	// Global keyboard shortcuts for tab navigation (Arrow keys)
	useEffect(() => {
		if (viewMode !== "tab" || boards.length <= 1) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Skip if user is typing in an input field
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				return;
			}

			const activeIndex = boards.findIndex((b) => b.id === activeBoard?.id);
			if (activeIndex === -1) return;

			if (e.key === "ArrowLeft" && activeIndex > 0) {
				e.preventDefault();
				actions.setActiveBoard(boards[activeIndex - 1].id);
			} else if (e.key === "ArrowRight" && activeIndex < boards.length - 1) {
				e.preventDefault();
				actions.setActiveBoard(boards[activeIndex + 1].id);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [viewMode, boards, activeBoard, actions]);

	// Sync text input and URL after board reorder
	useEffect(() => {
		if (!reorderPendingRef.current) return;
		reorderPendingRef.current = false;

		setStgyInput(boards.map((b) => b.stgyCode).join("\n"));

		if (shouldUpdateUrl) {
			const codes = boards.map((b) => b.stgyCode).filter((c) => c);
			const url = new URL(window.location.href);
			url.searchParams.delete("stgy");
			url.searchParams.delete("s");
			for (const code of codes.slice(0, MAX_BOARDS)) {
				url.searchParams.append("stgy", code);
			}
			window.history.replaceState(null, "", url.toString());
		}
	}, [boards, shouldUpdateUrl]);

	const [boardWidth, setBoardWidth] = useState<number | null>(null);
	const boardContainerRef = useRef<HTMLDivElement>(null);
	const isResizing = useRef(false);
	const reorderPendingRef = useRef(false);

	const handleResizeStart = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		isResizing.current = true;

		const handleMouseMove = (moveEvent: MouseEvent) => {
			if (!isResizing.current || !boardContainerRef.current) return;
			const containerRect = boardContainerRef.current.getBoundingClientRect();
			const newWidth = moveEvent.clientX - containerRect.left;
			setBoardWidth(Math.max(200, Math.min(896, newWidth)));
		};

		const handleMouseUp = () => {
			isResizing.current = false;
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	}, []);

	const [isGeneratingShortLink, setIsGeneratingShortLink] = useState(false);
	const [copiedShortLink, setCopiedShortLink] = useState(false);
	const [copiedStgyCode, setCopiedStgyCode] = useState(false);
	const [copiedBoardCode, setCopiedBoardCode] = useState(false);
	const boardData = activeBoard?.boardData ?? null;
	const activeBoardError = activeBoard?.error ?? null;

	// Count boards that failed to decode
	const failedBoardCount = boards.filter((b) => b.error !== null).length;

	const handleEditInEditor = useCallback(() => {
		if (!activeBoard?.stgyCode || !boardData) return;
		navigate({ to: "/editor", search: { stgy: activeBoard.stgyCode } });
	}, [activeBoard, boardData, navigate]);

	const handleEditAllInEditor = useCallback(() => {
		const validBoards = boards.filter((b) => b.stgyCode && b.boardData);
		if (validBoards.length === 0) return;

		const key = crypto.randomUUID();
		const folderName =
			groupInfo?.name ?? `Imported - ${new Date().toLocaleString()}`;

		sessionStorage.setItem(
			`board-import-${key}`,
			JSON.stringify({
				stgyCodes: validBoards.map((b) => b.stgyCode),
				folderName,
			}),
		);

		navigate({ to: "/editor", search: { import: "multi", key } });
	}, [boards, groupInfo?.name, navigate]);

	// Generate short links for multiple boards
	const handleGenerateShortLink = useCallback(async () => {
		const validBoards = boards.filter((b) => b.stgyCode && b.boardData);
		if (validBoards.length === 0) return;

		setIsGeneratingShortLink(true);
		setCopiedShortLink(false);
		try {
			const baseUrl = window.location.origin;

			const results = await Promise.all(
				validBoards.map((board) =>
					createShortLinkFn({ data: { stgy: board.stgyCode, baseUrl } }),
				),
			);

			const shortIds = results
				.filter(
					(
						r,
					): r is {
						success: true;
						data: { id: string; url: string; viewerUrl: string };
					} => r.success && !!r.data.id,
				)
				.map((r) => r.data.id);

			if (shortIds.length > 0) {
				const url = new URL(baseUrl);
				for (const shortId of shortIds) {
					url.searchParams.append("s", shortId);
				}
				// Add mode param when multiple boards are in grid mode
				if (shortIds.length > 1 && viewMode === "grid") {
					url.searchParams.set("mode", "grid");
				}

				await navigator.clipboard.writeText(url.toString());
				setCopiedShortLink(true);
				setTimeout(() => setCopiedShortLink(false), 2000);
			}
		} finally {
			setIsGeneratingShortLink(false);
		}
	}, [boards, viewMode]);

	const handleCopyStgyCode = useCallback(async () => {
		if (!stgyInput.trim()) return;
		try {
			await navigator.clipboard.writeText(stgyInput.trim());
			setCopiedStgyCode(true);
			setTimeout(() => setCopiedStgyCode(false), 2000);
		} catch {
			// Clipboard API not available
		}
	}, [stgyInput]);

	const handleCopyBoardCode = useCallback(async () => {
		if (!activeBoard?.stgyCode) return;
		try {
			await navigator.clipboard.writeText(activeBoard.stgyCode);
			setCopiedBoardCode(true);
			setTimeout(() => setCopiedBoardCode(false), 2000);
		} catch {
			// Clipboard API not available
		}
	}, [activeBoard?.stgyCode]);

	const handleLoadSample = useCallback(() => {
		setStgyInput(SAMPLE_STGY);
		actions.loadBoards(SAMPLE_STGY);
		setShouldUpdateUrl(true);

		const url = new URL(window.location.href);
		url.searchParams.delete("stgy");
		url.searchParams.delete("s");
		url.searchParams.append("stgy", SAMPLE_STGY);
		window.history.replaceState(null, "", url.toString());
	}, [actions]);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newValue = e.target.value;
			setStgyInput(newValue);
			// Don't enable URL updates for group views
			if (!shouldUpdateUrl && newValue.trim() && !groupInfo) {
				setShouldUpdateUrl(true);
			}
		},
		[shouldUpdateUrl, groupInfo],
	);

	// Auto-decode and URL update on input change (debounced)
	useEffect(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			actions.loadBoards(stgyInput);

			if (shouldUpdateUrl) {
				const codes = stgyInput
					.split("\n")
					.map((line) => line.trim())
					.filter((line) => line.length > 0);

				const url = new URL(window.location.href);
				url.searchParams.delete("stgy");
				url.searchParams.delete("s");

				for (const code of codes.slice(0, MAX_BOARDS)) {
					url.searchParams.append("stgy", code);
				}

				window.history.replaceState(null, "", url.toString());
			}
		}, DEBOUNCE_DELAY);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [stgyInput, actions, shouldUpdateUrl]);

	const handleSelectObject = useCallback(
		(objectId: string | null, _object: BoardObject | null) => {
			if (activeBoard) {
				actions.setSelectedObject(activeBoard.id, objectId);
			}
		},
		[activeBoard, actions],
	);

	const handleReorderBoards = useCallback(
		(fromIndex: number, toIndex: number) => {
			reorderPendingRef.current = true;
			actions.reorderBoards(fromIndex, toIndex);
		},
		[actions],
	);

	const handleCloseBoard = useCallback(
		(id: string) => {
			reorderPendingRef.current = true;
			actions.removeBoard(id);
		},
		[actions],
	);

	const handleOpenCreateGroupDialog = useCallback(() => {
		setIsCreateGroupDialogOpen(true);
	}, []);

	const handleGroupCreated = useCallback((groupId: string) => {
		// Use window.location for clean navigation to group URL
		window.location.href = `/?g=${groupId}`;
	}, []);

	// Get valid stgy codes for group creation
	const validStgyCodes = useMemo(
		() =>
			boards.filter((b) => b.stgyCode && b.boardData).map((b) => b.stgyCode),
		[boards],
	);

	// Check if stgyInput has valid stgy codes (for edit mode validation)
	const hasValidStgyCodesInInput = useMemo(() => {
		const codes = stgyInput
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0);
		// At least one code must be present and all codes must be valid
		return codes.length > 0 && codes.every((code) => isValidStgyCode(code));
	}, [stgyInput]);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<AppHeader currentPage="viewer" title={t("viewer.pageTitle")} />

			<main className="p-4 max-w-5xl mx-auto">
				{groupNotFound && (
					<div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>{t("viewer.group.notFound")}</p>
					</div>
				)}

				{groupInfo?.versionNotFound && (
					<div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
						<AlertCircle className="size-5" />
						<p>{t("viewer.group.versionNotFound")}</p>
					</div>
				)}

				{(groupNotFound || !groupInfo || groupEdit.isEditMode) && (
					<div className="mb-6 space-y-3">
						<div className="flex items-center justify-between">
							<Label htmlFor={stgyInputId}>
								{groupEdit.isEditMode
									? t("viewer.group.editStgyCodes")
									: t("viewer.inputLabel")}
							</Label>
							{stgyInput.trim() ? (
								<button
									type="button"
									onClick={handleCopyStgyCode}
									disabled={!boardData}
									className="flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{copiedStgyCode ? (
										<>
											<Check className="size-3.5" />
											{t("common.copied")}
										</>
									) : (
										<>
											<Copy className="size-3.5" />
											{t("common.copy")}
										</>
									)}
								</button>
							) : (
								!groupEdit.isEditMode && (
									<button
										type="button"
										onClick={handleLoadSample}
										className="flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
									>
										{t("viewer.loadSample")}
									</button>
								)
							)}
						</div>
						<Textarea
							id={stgyInputId}
							value={stgyInput}
							onChange={handleInputChange}
							className={
								groupEdit.isEditMode
									? "h-24 font-mono text-sm"
									: "h-12 font-mono text-sm"
							}
							placeholder={t("viewer.inputPlaceholder")}
							disabled={groupEdit.isUpdating}
						/>
					</div>
				)}

				{/* Error display: show when some boards failed to decode */}
				{failedBoardCount > 0 && (
					<div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>
							{t("viewer.multiBoard.parseError", { count: failedBoardCount })}
						</p>
					</div>
				)}

				{activeBoardError && boardCount === 1 && (
					<div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>{activeBoardError}</p>
					</div>
				)}

				{groupInfo && (
					<GroupInfoBanner
						name={groupEdit.displayedGroupName}
						description={groupEdit.displayedGroupDescription}
						boardCount={boardCount}
						groupUrl={groupUrl}
						stgyCodes={boards.map((b) => b.stgyCode)}
						version={groupEdit.groupVersion}
						currentVersion={groupInfo.currentVersion}
						isPastVersion={groupInfo.isPastVersion}
						isEditMode={groupEdit.isEditMode}
						isUpdating={groupEdit.isUpdating}
						updateError={groupEdit.updateError}
						editedName={groupEdit.editedName}
						editedDescription={groupEdit.editedDescription}
						hasValidStgyCodes={hasValidStgyCodesInInput}
						onEditedNameChange={groupEdit.setEditedName}
						onEditedDescriptionChange={groupEdit.setEditedDescription}
						onEditClick={groupEdit.handleEditClick}
						onCancelEdit={groupEdit.handleCancelEdit}
						onSaveEdit={groupEdit.handleSaveEdit}
						onDeleteClick={groupEdit.handleDeleteClick}
						onHistoryClick={groupEdit.handleHistoryClick}
						onBackToCurrentVersion={groupEdit.handleBackToCurrentVersion}
					/>
				)}

				<ViewerToolbar
					viewMode={viewMode}
					onViewModeChange={actions.setViewMode}
					boardCount={boardCount}
					onGenerateShortLink={handleGenerateShortLink}
					isGeneratingShortLink={isGeneratingShortLink}
					copiedShortLink={copiedShortLink}
					shortLinksEnabled={featureFlags.shortLinksEnabled}
					onEditAllInEditor={handleEditAllInEditor}
					onCreateGroup={handleOpenCreateGroupDialog}
					isGroupView={!!groupInfo}
				/>

				{viewMode === "tab" && (
					<ViewerTabs
						boards={boards}
						activeId={activeBoard?.id ?? null}
						onSelectTab={actions.setActiveBoard}
						onCloseTab={handleCloseBoard}
						onReorder={handleReorderBoards}
					/>
				)}

				{viewMode === "grid" && boardCount > 1 && (
					<ViewerGrid
						boards={boards}
						onSelectBoard={(id) => {
							actions.setActiveBoard(id);
							actions.setViewMode("tab");
						}}
						onCloseBoard={handleCloseBoard}
						onReorder={handleReorderBoards}
					/>
				)}

				{viewMode === "tab" && boardData && (
					<div className="space-y-4">
						<div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:p-3 bg-card border border-border rounded-lg">
							<div className="flex items-center gap-2 sm:gap-4 text-sm min-w-0">
								<span className="font-medium truncate">
									{boardData.name || t("viewer.boardInfo.unnamed")}
								</span>
								<span className="text-muted-foreground whitespace-nowrap">
									<span className="hidden xs:inline">
										{t("viewer.boardInfo.objectCount")}:{" "}
									</span>
									<span className="font-mono text-primary">
										{boardData.objects.length}
									</span>
								</span>
								<span className="text-muted-foreground hidden md:inline">
									{t("viewer.boardInfo.background")}:{" "}
									<span className="font-medium text-foreground">
										{t(`background.${boardData.backgroundId}`)}
									</span>
								</span>
							</div>
							<div className="flex items-center gap-1 sm:gap-2">
								<button
									type="button"
									className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border hover:border-border rounded-lg transition-all"
									onClick={handleCopyBoardCode}
									title={t("boardManager.copyStgyCode")}
								>
									{copiedBoardCode ? (
										<Check className="w-4 h-4" />
									) : (
										<Copy className="w-4 h-4" />
									)}
									<span className="hidden sm:inline">
										{copiedBoardCode
											? t("viewer.copiedCode")
											: t("viewer.copyCode")}
									</span>
								</button>
								{featureFlags.shortLinksEnabled && (
									<button
										type="button"
										className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
										onClick={handleGenerateShortLink}
										disabled={isGeneratingShortLink}
										title={t("viewer.multiBoard.share")}
									>
										{isGeneratingShortLink ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : copiedShortLink ? (
											<Check className="w-4 h-4" />
										) : (
											<Link className="w-4 h-4" />
										)}
										<span className="hidden sm:inline">
											{copiedShortLink
												? t("viewer.shortLink.copied")
												: t("viewer.multiBoard.share")}
										</span>
									</button>
								)}
								<button
									type="button"
									className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 rounded-lg transition-all"
									onClick={handleEditInEditor}
									title={t("imageGenerator.editInEditor")}
								>
									<Pencil className="w-4 h-4" />
									<span className="hidden sm:inline">
										{t("imageGenerator.editInEditor")}
									</span>
								</button>
								<button
									type="button"
									className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
									onClick={() => setIsExpandModalOpen(true)}
									title={t("viewer.expandBoard")}
								>
									<Maximize2 className="w-4 h-4" />
								</button>
							</div>
						</div>

						<div className="flex justify-center">
							<div
								ref={boardContainerRef}
								className="flex items-stretch"
								style={{
									width: boardWidth
										? `${boardWidth}px`
										: "min(896px, calc(70vh * 512 / 384))",
									maxWidth: "896px",
								}}
							>
								<BoardViewer
									boardData={boardData}
									responsive
									maxWidth={boardWidth ?? 896}
									selectedObjectId={selectedObjectId}
									onSelectObject={handleSelectObject}
								/>
							</div>
							<div
								role="slider"
								aria-label={t("viewer.resizeBoard")}
								aria-valuemin={200}
								aria-valuemax={896}
								aria-valuenow={boardWidth ?? 600}
								tabIndex={0}
								className="w-3 cursor-ew-resize flex items-center justify-center group ml-1"
								onMouseDown={handleResizeStart}
								title={t("viewer.resizeBoard")}
							>
								<div className="w-1.5 h-16 bg-muted-foreground/40 group-hover:bg-primary rounded-full transition-colors" />
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="h-[300px] md:h-[350px]">
								<ObjectListPanel
									objects={boardData.objects}
									selectedObjectId={selectedObjectId}
									onSelectObject={handleSelectObject}
								/>
							</div>

							<div className="p-4 bg-card border border-border rounded-lg">
								<h2 className="text-lg font-semibold mb-3 font-display">
									{t("viewer.selectedObject.title")}
								</h2>
								{selectedObject && selectedObjectId !== null ? (
									<SelectedObjectInfo
										index={boardData.objects.findIndex(
											(o) => o.id === selectedObjectId,
										)}
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

			{boardData && (
				<BoardExpandModal
					boardData={boardData}
					open={isExpandModalOpen}
					onOpenChange={setIsExpandModalOpen}
				/>
			)}

			<CreateGroupDialog
				open={isCreateGroupDialogOpen}
				onOpenChange={setIsCreateGroupDialogOpen}
				stgyCodes={validStgyCodes}
				onCreated={handleGroupCreated}
			/>

			{groupId && groupInfo && (
				<>
					<EditKeyDialog
						open={groupEdit.dialogs.editKey.isOpen}
						onOpenChange={groupEdit.dialogs.editKey.setIsOpen}
						onConfirm={groupEdit.dialogs.editKey.onConfirm}
					/>
					<GroupHistoryDialog
						open={groupEdit.dialogs.history.isOpen}
						onOpenChange={groupEdit.dialogs.history.setIsOpen}
						groupId={groupId}
						currentVersion={groupEdit.groupVersion}
						onViewVersion={groupEdit.dialogs.history.onViewVersion}
					/>
					<DeleteGroupDialog
						open={groupEdit.dialogs.delete.isOpen}
						onOpenChange={groupEdit.dialogs.delete.onOpenChange}
						groupName={groupInfo.name}
						isDeleting={groupEdit.isDeleting}
						error={groupEdit.deleteError}
						onConfirm={groupEdit.dialogs.delete.onConfirm}
					/>
				</>
			)}

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
