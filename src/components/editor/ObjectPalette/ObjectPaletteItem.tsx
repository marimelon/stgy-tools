/**
 * パレットアイテムコンポーネント
 */

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ObjectRenderer } from "@/components/board";
import { createDefaultObject } from "@/lib/editor";
import { PALETTE_ICON_OBJECT_IDS } from "./constants";
import { getViewBoxSize } from "./utils";

interface ObjectPaletteItemProps {
	objectId: number;
	onClick: () => void;
	isDebug?: boolean;
}

export function ObjectPaletteItem({
	objectId,
	onClick,
	isDebug = false,
}: ObjectPaletteItemProps) {
	const { t } = useTranslation();
	const [isHovered, setIsHovered] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});

	// オブジェクトサイズに基づいてviewBoxサイズを計算
	const viewBoxSize = getViewBoxSize(objectId);
	const objectPos = viewBoxSize / 2;

	const object = createDefaultObject(objectId, { x: objectPos, y: objectPos });
	const name = t(`object.${objectId}`, { defaultValue: `ID: ${objectId}` });

	// パレット専用アイコンがあるかどうか
	const hasPaletteIcon = PALETTE_ICON_OBJECT_IDS.includes(objectId);

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData("application/x-object-id", String(objectId));
		e.dataTransfer.effectAllowed = "copy";
	};

	// ツールチップ位置の計算
	useEffect(() => {
		if (isHovered && buttonRef.current && tooltipRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect();
			const tooltipRect = tooltipRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;

			// ツールチップの中央位置
			let left = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2;

			// 左端からはみ出す場合
			if (left < 8) {
				left = 8;
			}
			// 右端からはみ出す場合
			if (left + tooltipRect.width > viewportWidth - 8) {
				left = viewportWidth - tooltipRect.width - 8;
			}

			setTooltipStyle({
				position: "fixed",
				left: `${left}px`,
				top: `${buttonRect.top - tooltipRect.height - 8}px`,
			});
		}
	}, [isHovered]);

	return (
		<div className="relative">
			<button
				ref={buttonRef}
				type="button"
				onClick={onClick}
				draggable
				onDragStart={handleDragStart}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onFocus={() => setIsHovered(true)}
				onBlur={() => setIsHovered(false)}
				className="palette-item"
				aria-label={name}
			>
				{hasPaletteIcon ? (
					<img
						src={`/palette-icons/${objectId}.png`}
						alt=""
						aria-hidden="true"
						style={{
							width: "40px",
							height: "40px",
							display: "block",
							background: "var(--color-bg-deep)",
							borderRadius: "var(--radius-sm)",
							pointerEvents: "none",
							border: isDebug ? "2px solid #f59e0b" : undefined,
							objectFit: "contain",
						}}
					/>
				) : (
					<svg
						width={40}
						height={40}
						viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
						aria-hidden="true"
						style={{
							background: "var(--color-bg-deep)",
							borderRadius: "var(--radius-sm)",
							pointerEvents: "none",
							border: isDebug ? "2px solid #f59e0b" : undefined,
						}}
					>
						<ObjectRenderer
							object={object}
							index={0}
							showBoundingBox={false}
							selected={false}
						/>
					</svg>
				)}
			</button>
			{/* カスタムツールチップ */}
			{isHovered && (
				<div
					ref={tooltipRef}
					className="z-50 pointer-events-none"
					style={tooltipStyle}
					role="tooltip"
				>
					<div className="px-2 py-1 text-xs font-medium bg-popover text-popover-foreground border border-border rounded-md shadow-md whitespace-nowrap">
						{name}
					</div>
				</div>
			)}
		</div>
	);
}
