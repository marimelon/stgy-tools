/**
 * Comparison view component
 */

import type { RefObject } from "react";
import { useCallback, useRef, useState } from "react";
import { BoardViewer } from "@/components/board";
import {
	TARGET_BOARD_HEIGHT,
	TARGET_BOARD_WIDTH,
} from "@/lib/screenshot/types";
import type { BoardData } from "@/lib/stgy";

interface ComparisonViewProps {
	screenshotDataUrl: string | null;
	boardData: BoardData | null;
	viewMode: "side-by-side" | "overlay" | "diff" | "swipe";
	overlayOpacity: number;
	renderedContainerRef?: RefObject<HTMLDivElement | null>;
}

export function ComparisonView({
	screenshotDataUrl,
	boardData,
	viewMode,
	overlayOpacity,
	renderedContainerRef,
}: ComparisonViewProps) {
	if (!screenshotDataUrl && !boardData) {
		return (
			<div className="flex items-center justify-center h-[400px] text-muted-foreground">
				Upload a screenshot and enter stgy code to compare
			</div>
		);
	}

	switch (viewMode) {
		case "side-by-side":
			return (
				<SideBySideView
					screenshotDataUrl={screenshotDataUrl}
					boardData={boardData}
					renderedContainerRef={renderedContainerRef}
				/>
			);
		case "overlay":
			return (
				<OverlayView
					screenshotDataUrl={screenshotDataUrl}
					boardData={boardData}
					opacity={overlayOpacity}
					renderedContainerRef={renderedContainerRef}
				/>
			);
		case "diff":
			return (
				<DiffView
					screenshotDataUrl={screenshotDataUrl}
					boardData={boardData}
					renderedContainerRef={renderedContainerRef}
				/>
			);
		case "swipe":
			return (
				<SwipeView
					screenshotDataUrl={screenshotDataUrl}
					boardData={boardData}
					renderedContainerRef={renderedContainerRef}
				/>
			);
		default:
			return null;
	}
}

/** Side-by-side view */
function SideBySideView({
	screenshotDataUrl,
	boardData,
	renderedContainerRef,
}: {
	screenshotDataUrl: string | null;
	boardData: BoardData | null;
	renderedContainerRef?: RefObject<HTMLDivElement | null>;
}) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="bg-muted rounded-lg overflow-hidden">
				<div className="px-3 py-2 bg-muted-foreground/10 border-b border-border">
					<h3 className="font-semibold text-sm">Screenshot (Extracted)</h3>
				</div>
				<div className="p-4 flex justify-center items-center min-h-[400px]">
					{screenshotDataUrl ? (
						<img
							src={screenshotDataUrl}
							alt="Extracted board region"
							width={TARGET_BOARD_WIDTH}
							height={TARGET_BOARD_HEIGHT}
							className="border border-border"
						/>
					) : (
						<EmptyPlaceholder message="No screenshot loaded" />
					)}
				</div>
			</div>

			<div className="bg-muted rounded-lg overflow-hidden">
				<div className="px-3 py-2 bg-muted-foreground/10 border-b border-border">
					<h3 className="font-semibold text-sm">Rendered (stgy)</h3>
				</div>
				<div className="p-4 flex justify-center items-center min-h-[400px]">
					{boardData ? (
						<div ref={renderedContainerRef}>
							<BoardViewer boardData={boardData} scale={1} />
						</div>
					) : (
						<EmptyPlaceholder message="No stgy code entered" />
					)}
				</div>
			</div>
		</div>
	);
}

/** Overlay view */
function OverlayView({
	screenshotDataUrl,
	boardData,
	opacity,
	renderedContainerRef,
}: {
	screenshotDataUrl: string | null;
	boardData: BoardData | null;
	opacity: number;
	renderedContainerRef?: RefObject<HTMLDivElement | null>;
}) {
	return (
		<div className="flex justify-center">
			<div
				className="relative border border-border"
				style={{ width: TARGET_BOARD_WIDTH, height: TARGET_BOARD_HEIGHT }}
			>
				{screenshotDataUrl && (
					<div
						className="absolute inset-0"
						style={{ opacity: (100 - opacity) / 100 }}
					>
						<img
							src={screenshotDataUrl}
							alt="Screenshot"
							width={TARGET_BOARD_WIDTH}
							height={TARGET_BOARD_HEIGHT}
						/>
					</div>
				)}
				{boardData && (
					<div
						ref={renderedContainerRef}
						className="absolute inset-0"
						style={{ opacity: opacity / 100 }}
					>
						<BoardViewer boardData={boardData} scale={1} />
					</div>
				)}
			</div>
		</div>
	);
}

/** Diff view */
function DiffView({
	screenshotDataUrl,
	boardData,
	renderedContainerRef,
}: {
	screenshotDataUrl: string | null;
	boardData: BoardData | null;
	renderedContainerRef?: RefObject<HTMLDivElement | null>;
}) {
	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground text-center">
				Diff highlight: <span className="text-cyan-500">Cyan = Screenshot</span>
				, <span className="text-red-500">Red = Rendered</span>
			</p>
			<div className="flex justify-center">
				<div
					className="relative border border-border"
					style={{ width: TARGET_BOARD_WIDTH, height: TARGET_BOARD_HEIGHT }}
				>
					{/* Screenshot with color filter */}
					{screenshotDataUrl && (
						<div
							className="absolute inset-0"
							style={{
								mixBlendMode: "screen",
								filter: "hue-rotate(180deg) saturate(200%)",
								opacity: 0.7,
							}}
						>
							<img
								src={screenshotDataUrl}
								alt="Screenshot"
								width={TARGET_BOARD_WIDTH}
								height={TARGET_BOARD_HEIGHT}
							/>
						</div>
					)}
					{/* Rendered with color filter */}
					{boardData && (
						<div
							ref={renderedContainerRef}
							className="absolute inset-0"
							style={{
								mixBlendMode: "multiply",
								filter: "hue-rotate(0deg) saturate(200%)",
							}}
						>
							<BoardViewer boardData={boardData} scale={1} />
						</div>
					)}
				</div>
			</div>
			<p className="text-xs text-muted-foreground text-center">
				Note: Diff view uses blend modes for approximate visualization.
			</p>
		</div>
	);
}

/** Swipe view */
function SwipeView({
	screenshotDataUrl,
	boardData,
	renderedContainerRef,
}: {
	screenshotDataUrl: string | null;
	boardData: BoardData | null;
	renderedContainerRef?: RefObject<HTMLDivElement | null>;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [swipeX, setSwipeX] = useState(TARGET_BOARD_WIDTH / 2);
	const [isDragging, setIsDragging] = useState(false);

	const handleMouseDown = useCallback(() => {
		setIsDragging(true);
	}, []);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDragging || !containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const x = Math.max(
				0,
				Math.min(TARGET_BOARD_WIDTH, e.clientX - rect.left),
			);
			setSwipeX(x);
		},
		[isDragging],
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	return (
		<div className="flex justify-center">
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Swipe container for comparison */}
			<div
				ref={containerRef}
				className="relative border border-border cursor-ew-resize select-none"
				style={{ width: TARGET_BOARD_WIDTH, height: TARGET_BOARD_HEIGHT }}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
			>
				{screenshotDataUrl && (
					<div
						className="absolute inset-0 overflow-hidden"
						style={{ width: swipeX }}
					>
						<img
							src={screenshotDataUrl}
							alt="Screenshot"
							width={TARGET_BOARD_WIDTH}
							height={TARGET_BOARD_HEIGHT}
							draggable={false}
						/>
					</div>
				)}

				{boardData && (
					<div
						className="absolute top-0 bottom-0 overflow-hidden"
						style={{ left: swipeX, width: TARGET_BOARD_WIDTH - swipeX }}
					>
						<div ref={renderedContainerRef} style={{ marginLeft: -swipeX }}>
							<BoardViewer boardData={boardData} scale={1} />
						</div>
					</div>
				)}

				{/* Divider */}
				{/* biome-ignore lint/a11y/noStaticElementInteractions: Slider handle for swipe comparison */}
				<div
					className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
					style={{ left: swipeX - 2 }}
					onMouseDown={handleMouseDown}
				>
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-10 bg-white rounded shadow-lg flex items-center justify-center">
						<div className="flex gap-0.5">
							<div className="w-0.5 h-4 bg-gray-400 rounded" />
							<div className="w-0.5 h-4 bg-gray-400 rounded" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

/** Empty placeholder */
function EmptyPlaceholder({ message }: { message: string }) {
	return (
		<div
			className="flex items-center justify-center bg-card border border-dashed border-border rounded"
			style={{ width: TARGET_BOARD_WIDTH, height: TARGET_BOARD_HEIGHT }}
		>
			<p className="text-muted-foreground">{message}</p>
		</div>
	);
}
