/**
 * オブジェクトパレットのアクションボタン（ヘッダー用）
 */

import { Bug } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDebugMode } from "@/lib/editor";

export function ObjectPaletteActions() {
	const { t } = useTranslation();
	const { debugMode, toggleDebugMode } = useDebugMode();

	return (
		<button
			type="button"
			onClick={toggleDebugMode}
			className={`p-1 rounded transition-colors ${
				debugMode
					? "text-amber-400 bg-amber-400/20"
					: "text-muted-foreground hover:text-foreground hover:bg-muted"
			}`}
			title={`${t("objectPalette.debugMode")}: ${debugMode ? "ON" : "OFF"}`}
		>
			<Bug size={16} />
		</button>
	);
}
