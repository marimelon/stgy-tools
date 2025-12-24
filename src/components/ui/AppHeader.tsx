/**
 * 共通ヘッダーコンポーネント
 * 全ページで統一されたナビゲーションを提供
 */

import { Link } from "@tanstack/react-router";
import { useCallback } from "react";
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
 * ナビゲーションリンク
 */
function NavLink({
	to,
	active,
	children,
}: {
	to: string;
	active: boolean;
	children: React.ReactNode;
}) {
	return (
		<Link
			to={to}
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

	const changeLanguage = useCallback(
		(lang: string) => {
			i18n.changeLanguage(lang);
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
					<NavLink to="/" active={currentPage === "viewer"}>
						{t("nav.viewer")}
					</NavLink>
					<NavLink to="/editor" active={currentPage === "editor"}>
						{t("nav.editor")}
					</NavLink>
					<NavLink to="/image/generate" active={currentPage === "image"}>
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
				<NavLink to="/" active={currentPage === "viewer"}>
					{t("nav.viewer")}
				</NavLink>
				<NavLink to="/editor" active={currentPage === "editor"}>
					{t("nav.editor")}
				</NavLink>
				<NavLink to="/image/generate" active={currentPage === "image"}>
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
