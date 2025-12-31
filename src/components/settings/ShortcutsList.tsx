/**
 * キーボードショートカット一覧コンポーネント
 */

import { useTranslation } from "react-i18next";
import { KEYBOARD_SHORTCUTS } from "@/lib/editor/useKeyboardShortcuts";

/**
 * OSに応じた修飾キーの表示名を取得
 */
function getModifierKey(): string {
	if (typeof window === "undefined") return "Ctrl";
	return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";
}

/**
 * キーの表示をフォーマット
 */
function formatKey(key: string): string {
	const modifier = getModifierKey();
	return key
		.replace("Ctrl+", `${modifier}+`)
		.replace("Shift", "⇧")
		.replace("Delete", "Del");
}

/**
 * キーボードショートカット一覧
 */
export function ShortcutsList() {
	const { t } = useTranslation();
	const modifier = getModifierKey();

	return (
		<div className="space-y-1 max-h-64 overflow-y-auto">
			{KEYBOARD_SHORTCUTS.map((shortcut) => (
				<div
					key={shortcut.key}
					className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
				>
					<span className="text-sm text-muted-foreground">
						{t(`settings.shortcuts.${shortcut.key}`, shortcut.description)}
					</span>
					<kbd className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">
						{formatKey(shortcut.key)}
					</kbd>
				</div>
			))}
			<p className="text-xs text-muted-foreground pt-2 px-2">
				{t("settings.shortcutsNote", { modifier })}
			</p>
		</div>
	);
}
