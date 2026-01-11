/**
 * Focus mode indicator
 *
 * Displays at the top of canvas during focus mode
 */

import { Focus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FocusModeIndicatorProps {
	groupName: string;
	onExit: () => void;
}
export function FocusModeIndicator({
	groupName,
	onExit,
}: FocusModeIndicatorProps) {
	const { t } = useTranslation();

	return (
		<div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-lg z-10">
			<Focus className="w-4 h-4" />
			<span>{t("editor.focusMode", { groupName })}</span>
			<button
				type="button"
				onClick={onExit}
				className="hover:bg-blue-500 p-1 rounded"
				title={t("editor.exitFocus")}
			>
				<X className="w-3 h-3" />
			</button>
		</div>
	);
}
