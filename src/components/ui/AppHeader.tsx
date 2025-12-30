/**
 * 共通ヘッダーコンポーネント
 * 全ページで統一されたナビゲーションを提供
 */

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
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
	children,
}: {
	to: string;
	active: boolean;
	stgy?: string;
	children: React.ReactNode;
}) {
	// stgyを引き継ぐべきパスの場合のみsearchパラメータを付与
	const shouldPreserveStgy = stgy && STGY_PRESERVE_PATHS.includes(to);

	return (
		<Link
			to={to}
			search={shouldPreserveStgy ? { stgy } : undefined}
			className={cn(
				"text-sm font-medium transition-colors",
				active
					? "text-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{children}
		</Link>
	);
}

/**
 * 言語セレクター
 */
function LanguageSelector() {
	const { i18n, t } = useTranslation();
	const location = useLocation();
	const navigate = useNavigate();

	const changeLanguage = useCallback(
		(lang: string) => {
			i18n.changeLanguage(lang);
			// URLのlangパラメータも更新
			const searchParams = new URLSearchParams(location.search);
			searchParams.set("lang", lang);
			navigate({
				to: location.pathname,
				search: Object.fromEntries(searchParams.entries()),
				replace: true,
			});
		},
		[i18n, location.pathname, location.search, navigate],
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
 */
function useCurrentStgy(): string | undefined {
	const location = useLocation();

	return useMemo(() => {
		const searchParams = new URLSearchParams(location.search);
		return searchParams.get("stgy") ?? undefined;
	}, [location.search]);
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
					<NavLink to="/" active={currentPage === "viewer"} stgy={stgy}>
						{t("nav.viewer")}
					</NavLink>
					<NavLink to="/editor" active={currentPage === "editor"} stgy={stgy}>
						{t("nav.editor")}
					</NavLink>
					<NavLink
						to="/image/generate"
						active={currentPage === "image"}
						stgy={stgy}
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

	return (
		<header
			className={cn(
				"app-header flex items-center justify-between px-4 py-2.5",
				className,
			)}
		>
			{/* ロゴ・タイトル */}
			<div className="flex items-center gap-3">
				{logo}
				<h1 className="app-logo">{title ?? "STGY Tools"}</h1>
			</div>

			{/* ナビゲーション */}
			<nav className="flex items-center gap-3 md:gap-4">
				<NavLink to="/" active={currentPage === "viewer"} stgy={stgy}>
					{t("nav.viewer")}
				</NavLink>
				<NavLink to="/editor" active={currentPage === "editor"} stgy={stgy}>
					{t("nav.editor")}
				</NavLink>
				<NavLink
					to="/image/generate"
					active={currentPage === "image"}
					stgy={stgy}
				>
					{t("nav.imageGenerator")}
				</NavLink>
				{showLanguageSelector && (
					<div className="ml-2">
						<LanguageSelector />
					</div>
				)}
			</nav>
		</header>
	);
}
