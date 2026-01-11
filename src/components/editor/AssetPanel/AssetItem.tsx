/**
 * Asset item component
 *
 * Preview display and interaction for assets
 */

import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { ObjectRenderer } from "@/components/board";
import {
	type AssetWithRuntimeIds,
	calculatePreviewViewBox,
} from "@/lib/assets";

interface AssetItemProps {
	/** Asset data */
	asset: AssetWithRuntimeIds;
	/** Callback on double click */
	onApply: (asset: AssetWithRuntimeIds) => void;
	/** Callback on right click */
	onContextMenu: (e: MouseEvent, asset: AssetWithRuntimeIds) => void;
}

/**
 * Asset item component
 */
export function AssetItem({ asset, onApply, onContextMenu }: AssetItemProps) {
	const { t } = useTranslation();

	const viewBox = calculatePreviewViewBox(asset.bounds, 20);

	const handleDoubleClick = () => {
		onApply(asset);
	};

	const handleContextMenu = (e: MouseEvent) => {
		e.preventDefault();
		onContextMenu(e, asset);
	};

	return (
		<button
			type="button"
			onDoubleClick={handleDoubleClick}
			onContextMenu={handleContextMenu}
			className="w-full bg-card hover:bg-accent/50 border border-border rounded-md p-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
			title={t("assetPanel.contextMenu.apply")}
		>
			{/* Preview */}
			<div
				className="w-full aspect-square bg-muted rounded overflow-hidden mb-2"
				style={{ background: "var(--color-bg-deep)" }}
			>
				<svg
					width="100%"
					height="100%"
					viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
					preserveAspectRatio="xMidYMid meet"
					role="img"
					aria-label={asset.name}
				>
					{/* SVG renders later elements on top, so render in reverse order */}
					{[...asset.objects].reverse().map((obj) => (
						<ObjectRenderer key={obj.id} object={obj} selected={false} />
					))}
				</svg>
			</div>

			{/* Asset name */}
			<div className="text-xs font-medium truncate" title={asset.name}>
				{asset.name}
			</div>

			{/* Object count */}
			<div className="text-xs text-muted-foreground">
				{t("assetPanel.objectCount", { count: asset.objects.length })}
			</div>
		</button>
	);
}
