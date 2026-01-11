/**
 * Circular placement mode indicator
 *
 * Displays at the top of canvas during circular placement mode
 */

import { Circle, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CircularModeIndicatorProps {
	objectCount: number;
	onExit: () => void;
}
export function CircularModeIndicator({
	objectCount,
	onExit,
}: CircularModeIndicatorProps) {
	const { t } = useTranslation();

	return (
		<div className="absolute top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-lg z-10">
			<Circle className="w-4 h-4" />
			<span>{t("editor.circularMode", { count: objectCount })}</span>
			<button
				type="button"
				onClick={onExit}
				className="hover:bg-purple-500 p-1 rounded"
				title={t("editor.exitCircularMode")}
			>
				<X className="w-3 h-3" />
			</button>
		</div>
	);
}
