/**
 * Editor error toast
 */

import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEditorActions, useLastError } from "@/lib/editor";
import type { EditorError } from "@/lib/editor/types";

const TOAST_DURATION = 3000;

export function ErrorToast() {
	const { t } = useTranslation();
	const lastError = useLastError();
	const { clearError } = useEditorActions();
	const [visibleError, setVisibleError] = useState<EditorError | null>(null);

	useEffect(() => {
		if (lastError) {
			setVisibleError(lastError);
			clearError();

			const timer = setTimeout(() => {
				setVisibleError(null);
			}, TOAST_DURATION);

			return () => clearTimeout(timer);
		}
	}, [lastError, clearError]);

	if (!visibleError) return null;

	const message = t(visibleError.key, visibleError.params);

	return (
		<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive text-destructive-foreground shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
			<AlertCircle className="size-5 shrink-0" />
			<span className="text-sm">{message}</span>
			<button
				type="button"
				onClick={() => setVisibleError(null)}
				className="text-destructive-foreground/70 hover:text-destructive-foreground transition-colors"
			>
				<X className="size-4" />
			</button>
		</div>
	);
}
