/**
 * 共通ヘッダーコンポーネント
 * 全ページで統一されたナビゲーションを提供
 */

import { useLocation } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** 言語オプション */
const LANGUAGE_OPTIONS = [
	{ value: "ja", label: "日本語" },
	{ value: "en", label: "English" },
] as const;

export type PageId = "viewer" | "editor" | "image";

interface AppHeaderProps {
	/** 現在のページ */
	currentPage: PageId;
	/** ロゴを表示するか（デフォルト: true） */
	showLogo?: boolean;
	/** カスタムタイトル（指定しない場合はデフォルトのロゴ） */
	title?: string;
	/** カスタムロゴ要素 */
	logo?: React.ReactNode;
	/** 言語セレクターを表示するか（デフォルト: true） */
	showLanguageSelector?: boolean;
	/** 追加のクラス名 */
	className?: string;
}

/**
 * stgyパラメータを引き継ぐべきページかどうか
 * viewer (/) と image (/image/generate) 間では stgy を引き継ぐ
 */
const STGY_PRESERVE_PATHS = ["/", "/image/generate"];

/**
 * ナビゲーションリンク
 */
function NavLink({
	to,
	active,
	stgy,
	lang,
	children,
}: {
	to: string;
	active: boolean;
	stgy?: string;
	lang?: string;
	children: React.ReactNode;
}) {
	// stgyを引き継ぐべきパスの場合のみstgyパラメータを付与
	const shouldPreserveStgy = stgy && STGY_PRESERVE_PATHS.includes(to);

	// URLを構築（配列パラメータを避けるため直接構築）
	const href = useMemo(() => {
		const params = new URLSearchParams();
		if (shouldPreserveStgy && stgy) {
			params.set("stgy", stgy);
		}
		if (lang) {
			params.set("lang", lang);
		}
		const queryString = params.toString();
		return queryString ? `${to}?${queryString}` : to;
	}, [to, shouldPreserveStgy, stgy, lang]);

	return (
		<a
			href={href}
			className={cn(
				"text-sm font-medium transition-colors",
				active
					? "text-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{children}
		</a>
	);
}

/**
 * 言語セレクター
 */
function LanguageSelector() {
	const { i18n, t } = useTranslation();

	const changeLanguage = useCallback(
		(lang: string) => {
			i18n.changeLanguage(lang);
			// URLのlangパラメータも更新（配列パラメータを保持するためwindow.locationを使用）
			const searchParams = new URLSearchParams(window.location.search);
			searchParams.set("lang", lang);
			const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
			window.history.replaceState(null, "", newUrl);
		},
		[i18n],
	);

	return (
		<select
			className="bg-secondary text-foreground border border-border rounded px-2 py-1.5 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
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
	);
}

/**
 * 現在のURLからstgyパラメータを取得するフック
 * 複数指定されている場合は最初の値を返す
 */
function useCurrentStgy(): string | undefined {
	const location = useLocation();

	// biome-ignore lint/correctness/useExhaustiveDependencies: URL変更時に再評価が必要
	return useMemo(() => {
		// window.location.searchを使用して配列パラメータを正しく処理
		const searchParams = new URLSearchParams(window.location.search);
		return searchParams.get("stgy") ?? undefined;
	}, [location.href]);
}

/**
 * 現在のURLからlangパラメータを取得するフック
 */
function useCurrentLang(): string | undefined {
	const location = useLocation();

	// biome-ignore lint/correctness/useExhaustiveDependencies: URL変更時に再評価が必要
	return useMemo(() => {
		const searchParams = new URLSearchParams(window.location.search);
		return searchParams.get("lang") ?? undefined;
	}, [location.href]);
}

/**
 * 共通ヘッダー
 */
export function AppHeader({
	currentPage,
	showLogo = true,
	title,
	logo,
	showLanguageSelector = true,
	className,
}: AppHeaderProps) {
	const { t } = useTranslation();
	const stgy = useCurrentStgy();
	const lang = useCurrentLang();

	return (
		<header className={cn("app-header p-4", className)}>
			<div className="flex items-center justify-between max-w-6xl mx-auto">
				{/* ロゴ・タイトル */}
				<div className="flex items-center gap-3">
					{showLogo && logo}
					<h1 className="app-logo text-xl md:text-2xl">
						{title ?? "STGY Tools"}
					</h1>
				</div>

				{/* ナビゲーション */}
				<nav className="flex items-center gap-3 md:gap-4">
					<NavLink
						to="/"
						active={currentPage === "viewer"}
						stgy={stgy}
						lang={lang}
					>
						{t("nav.viewer")}
					</NavLink>
					<NavLink
						to="/editor"
						active={currentPage === "editor"}
						stgy={stgy}
						lang={lang}
					>
						{t("nav.editor")}
					</NavLink>
					<NavLink
						to="/image/generate"
						active={currentPage === "image"}
						stgy={stgy}
						lang={lang}
					>
						{t("nav.imageGenerator")}
					</NavLink>
					{showLanguageSelector && <LanguageSelector />}
				</nav>
			</div>
		</header>
	);
}

/**
 * コンパクト版ヘッダー（Editorなど画面領域を最大化したいページ向け）
 */
export function CompactAppHeader({
	currentPage,
	title,
	logo,
	showLanguageSelector = false,
	className,
}: AppHeaderProps) {
	const { t } = useTranslation();
	const stgy = useCurrentStgy();
	const lang = useCurrentLang();

	return (
		<header
			className={cn(
				"app-header flex items-center justify-between px-3 py-1",
				className,
			)}
		>
			{/* ロゴ・タイトル */}
			<div className="flex items-center gap-2">
				{logo}
				<h1 className="app-logo text-sm">{title ?? "STGY Tools"}</h1>
			</div>

			{/* ナビゲーション */}
			<nav className="flex items-center gap-2 md:gap-3">
				<NavLink
					to="/"
					active={currentPage === "viewer"}
					stgy={stgy}
					lang={lang}
				>
					{t("nav.viewer")}
				</NavLink>
				<NavLink
					to="/editor"
					active={currentPage === "editor"}
					stgy={stgy}
					lang={lang}
				>
					{t("nav.editor")}
				</NavLink>
				<NavLink
					to="/image/generate"
					active={currentPage === "image"}
					stgy={stgy}
					lang={lang}
				>
					{t("nav.imageGenerator")}
				</NavLink>
				{showLanguageSelector && (
					<div className="ml-1">
						<LanguageSelector />
					</div>
				)}
			</nav>
		</header>
	);
}
