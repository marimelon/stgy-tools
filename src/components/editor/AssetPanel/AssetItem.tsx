/**
 * アセットアイテムコンポーネント
 *
 * アセットのプレビュー表示とインタラクション
 */

import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { ObjectRenderer } from "@/components/board";
import { calculatePreviewViewBox, type StoredAsset } from "@/lib/assets";

interface AssetItemProps {
	/** アセットデータ */
	asset: StoredAsset;
	/** ダブルクリック時のコールバック */
	onApply: (asset: StoredAsset) => void;
	/** 右クリック時のコールバック */
	onContextMenu: (e: MouseEvent, asset: StoredAsset) => void;
}

/**
 * アセットアイテムコンポーネント
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
			{/* プレビュー */}
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
					{/* SVGは後から描画したものが上に表示されるため、逆順で描画 */}
					{[...asset.objects].reverse().map((obj, index) => (
						<ObjectRenderer
							key={`${asset.id}-${asset.objects.length - 1 - index}`}
							object={obj}
							index={asset.objects.length - 1 - index}
							selected={false}
						/>
					))}
				</svg>
			</div>

			{/* アセット名 */}
			<div className="text-xs font-medium truncate" title={asset.name}>
				{asset.name}
			</div>

			{/* オブジェクト数 */}
			<div className="text-xs text-muted-foreground">
				{t("assetPanel.objectCount", { count: asset.objects.length })}
			</div>
		</button>
	);
}
