/**
 * Background Renderer (shared component)
 * Used by both server-side and client-side
 */

import { useCallback, useState } from "react";
import type { BackgroundId } from "@/lib/stgy/types";

interface BackgroundRendererProps {
	backgroundId: BackgroundId;
	width: number;
	height: number;
	/** For server-side: Base64 Data URI */
	imageDataUri?: string;
}

/**
 * Background Renderer
 * Displays image corresponding to BackgroundId
 * - Client: Prefers /assets/backgrounds-hr/{id}.png, falls back to /assets/backgrounds/{id}.png
 * - Server: Uses imageDataUri (Base64)
 */
export function BackgroundRenderer({
	backgroundId,
	width,
	height,
	imageDataUri,
}: BackgroundRendererProps) {
	const [useHr, setUseHr] = useState(true);

	const handleError = useCallback(() => {
		// Fall back to standard version if HR version not found
		if (useHr) {
			setUseHr(false);
		}
	}, [useHr]);

	// BackgroundId 1-7 is the valid range
	if (backgroundId < 1 || backgroundId > 7) {
		return null;
	}

	// Server-side uses Data URI, client prefers HR version with fallback
	const href =
		imageDataUri ??
		(useHr
			? `/assets/backgrounds-hr/${backgroundId}.png`
			: `/assets/backgrounds/${backgroundId}.png`);

	return (
		<image
			href={href}
			x={0}
			y={0}
			width={width}
			height={height}
			onError={handleError}
		/>
	);
}
