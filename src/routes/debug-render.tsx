/**
 * Client vs Server rendering comparison debug page
 * Visually compare rendering differences between the two
 */

import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	Download,
	Eye,
	EyeOff,
	Layers,
	SplitSquareHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import { BoardViewer } from "@/components/board";
import { DebugHeader } from "@/components/debug/DebugHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { generateDebugPageMeta } from "@/lib/seo";
import type { BoardData, BoardObject } from "@/lib/stgy";
import {
	assignBoardObjectIds,
	decodeStgy,
	ObjectNames,
	parseBoardData,
} from "@/lib/stgy";

const seo = generateDebugPageMeta("Render Comparison Debug");

export const Route = createFileRoute("/debug-render")({
	component: RenderDebugPage,
	head: () => seo,
});

/** View mode */
type ViewMode = "side-by-side" | "overlay" | "diff";

/** Default sample codes */
const SAMPLE_CODES = {
	"Basic (Waymarks)":
		"[stgy:a0OcAwAYAfwgAFYAFBAAZYTLdYTLdYTLdYTLdYTLdYTLdYTLd]",
	"AoE Attack": "[stgy:a0ScAwAYAfwJAAAHAGQAAMgA+g==]",
};

function RenderDebugPage() {
	const [inputCode, setInputCode] = useState("");
	const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
	const [overlayOpacity, setOverlayOpacity] = useState(50);
	const [serverSvg, setServerSvg] = useState<string | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showClient, setShowClient] = useState(true);
	const [showServer, setShowServer] = useState(true);
	const inputCodeId = useId();

	const parseResult = (() => {
		if (!inputCode.trim()) return null;
		try {
			const binary = decodeStgy(inputCode.trim());
			const parsed = parseBoardData(binary);
			const boardData = assignBoardObjectIds(parsed);
			return { boardData, error: null };
		} catch (e) {
			const message = e instanceof Error ? e.message : "Unknown error";
			return { boardData: null, error: message };
		}
	})();

	const fetchServerSvg = useCallback(async (code: string) => {
		if (!code.trim()) {
			setServerSvg(null);
			setServerError(null);
			return;
		}

		setIsLoading(true);
		setServerError(null);

		try {
			const encodedCode = encodeURIComponent(code.trim());
			const timestamp = Date.now();
			const response = await fetch(
				`/image?stgy=${encodedCode}&format=svg&_t=${timestamp}`,
			);

			if (!response.ok) {
				const errorData = await response
					.json()
					.catch(() => ({ error: "Unknown error" }));
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			const svgText = await response.text();
			setServerSvg(svgText);
		} catch (e) {
			const message = e instanceof Error ? e.message : "Unknown error";
			setServerError(message);
			setServerSvg(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchServerSvg(inputCode);
		}, 500);
		return () => clearTimeout(timer);
	}, [inputCode, fetchServerSvg]);

	const applySampleCode = (code: string) => {
		setInputCode(code);
	};

	const downloadSvg = (svg: string, filename: string) => {
		const blob = new Blob([svg], { type: "image/svg+xml" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<DebugHeader
				title="Render Comparison Debug"
				description="Compare client-side and server-side rendering differences"
			/>

			<main className="p-4 space-y-4 max-w-7xl mx-auto">
				<section className="bg-card border border-border rounded-lg p-4">
					<div className="flex items-center justify-between mb-2">
						<Label htmlFor="input-code">Enter stgy code:</Label>
						<div className="flex gap-2">
							{Object.entries(SAMPLE_CODES).map(([name, code]) => (
								<Button
									key={name}
									variant="outline"
									size="sm"
									onClick={() => applySampleCode(code)}
								>
									{name}
								</Button>
							))}
						</div>
					</div>
					<Textarea
						id={inputCodeId}
						value={inputCode}
						onChange={(e) => setInputCode(e.target.value)}
						placeholder="[stgy:a...]"
						className="h-20 font-mono text-sm"
					/>
				</section>

				<section className="bg-card border border-border rounded-lg p-4">
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">View mode:</span>
							<div className="flex gap-1">
								<Button
									variant={viewMode === "side-by-side" ? "default" : "outline"}
									size="sm"
									onClick={() => setViewMode("side-by-side")}
								>
									<SplitSquareHorizontal className="size-4 mr-1" />
									Side by Side
								</Button>
								<Button
									variant={viewMode === "overlay" ? "default" : "outline"}
									size="sm"
									onClick={() => setViewMode("overlay")}
								>
									<Layers className="size-4 mr-1" />
									Overlay
								</Button>
								<Button
									variant={viewMode === "diff" ? "default" : "outline"}
									size="sm"
									onClick={() => setViewMode("diff")}
								>
									Diff
								</Button>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant={showClient ? "default" : "outline"}
								size="sm"
								onClick={() => setShowClient(!showClient)}
							>
								{showClient ? (
									<Eye className="size-4 mr-1" />
								) : (
									<EyeOff className="size-4 mr-1" />
								)}
								Client
							</Button>
							<Button
								variant={showServer ? "default" : "outline"}
								size="sm"
								onClick={() => setShowServer(!showServer)}
							>
								{showServer ? (
									<Eye className="size-4 mr-1" />
								) : (
									<EyeOff className="size-4 mr-1" />
								)}
								Server
							</Button>
						</div>

						{viewMode === "overlay" && (
							<div className="flex items-center gap-2 flex-1 max-w-xs">
								<span className="text-sm text-muted-foreground whitespace-nowrap">
									Opacity:
								</span>
								<Slider
									value={[overlayOpacity]}
									onValueChange={([v]) => setOverlayOpacity(v)}
									min={0}
									max={100}
									step={1}
									className="flex-1"
								/>
								<span className="text-sm font-mono w-10">
									{overlayOpacity}%
								</span>
							</div>
						)}
					</div>
				</section>

				{parseResult?.error && (
					<div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>Client error: {parseResult.error}</p>
					</div>
				)}
				{serverError && (
					<div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>Server error: {serverError}</p>
					</div>
				)}

				{(parseResult?.boardData || serverSvg) && (
					<section className="bg-card border border-border rounded-lg p-4">
						<h2 className="text-lg font-semibold mb-4">Rendering Result</h2>

						{viewMode === "side-by-side" && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{showClient && (
									<RenderPanel
										title="Client (React)"
										subtitle="BoardViewer component"
										loading={false}
									>
										{parseResult?.boardData ? (
											<BoardViewer
												boardData={parseResult.boardData}
												scale={1}
											/>
										) : (
											<EmptyState message="Enter a valid stgy code" />
										)}
									</RenderPanel>
								)}

								{showServer && (
									<RenderPanel
										title="Server (SVG)"
										subtitle="svgRenderer.tsx"
										loading={isLoading}
										onDownload={
											serverSvg
												? () => downloadSvg(serverSvg, "server-render.svg")
												: undefined
										}
									>
										{serverSvg ? (
											<div
												className="flex justify-center"
												// biome-ignore lint/security/noDangerouslySetInnerHtml: Display SVG fetched from server
												dangerouslySetInnerHTML={{ __html: serverSvg }}
											/>
										) : (
											<EmptyState
												message={
													isLoading ? "Loading..." : "Enter a valid stgy code"
												}
											/>
										)}
									</RenderPanel>
								)}
							</div>
						)}

						{viewMode === "overlay" && (
							<RenderPanel
								title="Overlay Comparison"
								subtitle={`Client: ${100 - overlayOpacity}% / Server: ${overlayOpacity}%`}
								loading={isLoading}
							>
								<div className="relative" style={{ width: 512, height: 384 }}>
									{showClient && parseResult?.boardData && (
										<div
											className="absolute inset-0"
											style={{ opacity: (100 - overlayOpacity) / 100 }}
										>
											<BoardViewer
												boardData={parseResult.boardData}
												scale={1}
											/>
										</div>
									)}
									{showServer && serverSvg && (
										<div
											className="absolute inset-0 flex justify-center"
											style={{ opacity: overlayOpacity / 100 }}
											// biome-ignore lint/security/noDangerouslySetInnerHtml: Display SVG fetched from server
											dangerouslySetInnerHTML={{ __html: serverSvg }}
										/>
									)}
								</div>
							</RenderPanel>
						)}

						{viewMode === "diff" && parseResult?.boardData && serverSvg && (
							<DiffView
								boardData={parseResult.boardData}
								serverSvg={serverSvg}
							/>
						)}
					</section>
				)}

				{parseResult?.boardData && (
					<section className="bg-card border border-border rounded-lg p-4">
						<h2 className="text-lg font-semibold mb-4">
							Object List ({parseResult.boardData.objects.length} items)
						</h2>
						<div className="overflow-x-auto">
							<ObjectTable objects={parseResult.boardData.objects} />
						</div>
					</section>
				)}

				{serverSvg && (
					<section className="bg-card border border-border rounded-lg p-4">
						<h2 className="text-lg font-semibold mb-4">Server SVG Source</h2>
						<pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre">
							{serverSvg}
						</pre>
					</section>
				)}
			</main>
		</div>
	);
}

/** Rendering panel */
function RenderPanel({
	title,
	subtitle,
	loading,
	onDownload,
	children,
}: {
	title: string;
	subtitle: string;
	loading: boolean;
	onDownload?: () => void;
	children: React.ReactNode;
}) {
	return (
		<div className="bg-muted rounded-lg overflow-hidden">
			<div className="flex items-center justify-between px-3 py-2 bg-muted-foreground/10">
				<div>
					<h3 className="font-semibold text-sm">{title}</h3>
					<p className="text-xs text-muted-foreground">{subtitle}</p>
				</div>
				<div className="flex items-center gap-2">
					{loading && <Badge variant="secondary">Loading...</Badge>}
					{onDownload && (
						<Button variant="ghost" size="sm" onClick={onDownload}>
							<Download className="size-4" />
						</Button>
					)}
				</div>
			</div>
			<div className="p-4 flex justify-center items-center min-h-[400px]">
				{children}
			</div>
		</div>
	);
}

/** Empty state display */
function EmptyState({ message }: { message: string }) {
	return (
		<div className="flex items-center justify-center w-[512px] h-[384px] bg-card border border-dashed border-border rounded">
			<p className="text-muted-foreground">{message}</p>
		</div>
	);
}

/** Diff view */
function DiffView({
	boardData,
	serverSvg,
}: {
	boardData: BoardData;
	serverSvg: string;
}) {
	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Diff highlight:{" "}
				<span className="text-green-500">Green=Client only</span>,{" "}
				<span className="text-red-500">Red=Server only</span>, Matching parts
				shown in normal color
			</p>
			<div className="relative" style={{ width: 512, height: 384 }}>
				<div
					className="absolute inset-0 flex justify-center"
					style={{
						mixBlendMode: "multiply",
						filter: "hue-rotate(0deg) saturate(200%)",
					}}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Display SVG fetched from server
					dangerouslySetInnerHTML={{ __html: serverSvg }}
				/>
				<div
					className="absolute inset-0"
					style={{
						mixBlendMode: "screen",
						filter: "hue-rotate(90deg) saturate(150%)",
						opacity: 0.7,
					}}
				>
					<BoardViewer boardData={boardData} scale={1} />
				</div>
			</div>
			<p className="text-xs text-muted-foreground">
				Note: Diff display uses blend modes for approximation. No color change
				when perfectly matched.
			</p>
		</div>
	);
}

/** Object table */
function ObjectTable({ objects }: { objects: BoardObject[] }) {
	return (
		<table className="w-full text-sm">
			<thead>
				<tr className="border-b border-border text-left">
					<th className="px-2 py-1">#</th>
					<th className="px-2 py-1">ObjectId</th>
					<th className="px-2 py-1">Name</th>
					<th className="px-2 py-1">Position</th>
					<th className="px-2 py-1">Rotation</th>
					<th className="px-2 py-1">Size</th>
					<th className="px-2 py-1">Color</th>
					<th className="px-2 py-1">Flags</th>
					<th className="px-2 py-1">Parameters</th>
				</tr>
			</thead>
			<tbody>
				{objects.map((obj, idx) => (
					<tr
						key={`${obj.objectId}-${obj.position.x}-${obj.position.y}-${idx}`}
						className="border-b border-border/50 hover:bg-muted/50"
					>
						<td className="px-2 py-1 font-mono text-muted-foreground">{idx}</td>
						<td className="px-2 py-1 font-mono">{obj.objectId}</td>
						<td className="px-2 py-1">
							{ObjectNames[obj.objectId] ?? "Unknown"}
						</td>
						<td className="px-2 py-1 font-mono text-xs">
							({obj.position.x.toFixed(1)}, {obj.position.y.toFixed(1)})
						</td>
						<td className="px-2 py-1 font-mono text-xs">{obj.rotation}°</td>
						<td className="px-2 py-1 font-mono text-xs">{obj.size}%</td>
						<td className="px-2 py-1">
							<div className="flex items-center gap-1">
								<div
									className="w-4 h-4 rounded border border-border"
									style={{
										backgroundColor: `rgba(${obj.color.r}, ${obj.color.g}, ${obj.color.b}, ${1 - obj.color.opacity / 100})`,
									}}
								/>
								<span className="font-mono text-xs">
									{obj.color.r},{obj.color.g},{obj.color.b}
								</span>
							</div>
						</td>
						<td className="px-2 py-1">
							<div className="flex flex-wrap gap-1">
								{!obj.flags.visible && (
									<Badge variant="outline" className="text-xs">
										Hidden
									</Badge>
								)}
								{obj.flags.flipHorizontal && (
									<Badge variant="outline" className="text-xs">
										Flip H
									</Badge>
								)}
								{obj.flags.flipVertical && (
									<Badge variant="outline" className="text-xs">
										Flip V
									</Badge>
								)}
								{obj.flags.locked && (
									<Badge variant="outline" className="text-xs">
										Locked
									</Badge>
								)}
							</div>
						</td>
						<td className="px-2 py-1 font-mono text-xs">
							{[obj.param1, obj.param2, obj.param3]
								.filter((p) => p !== undefined)
								.map((p, i) => `p${i + 1}=${p}`)
								.join(", ") || "-"}
							{obj.text && (
								<span className="ml-1 text-muted-foreground">
									text="{obj.text}"
								</span>
							)}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
