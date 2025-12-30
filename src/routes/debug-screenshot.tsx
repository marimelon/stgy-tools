/**
 * スクリーンショット比較デバッグページ
 * ゲーム内スクリーンショットとstgyレンダリング結果を比較
 */

import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	Layers,
	ScanSearch,
	Settings2,
	SplitSquareHorizontal,
	SwatchBook,
} from "lucide-react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { DebugHeader } from "@/components/debug/DebugHeader";
import { ComparisonView } from "@/components/debug/screenshot/ComparisonView";
import { ManualAdjustment } from "@/components/debug/screenshot/ManualAdjustment";
import { ScreenshotUploader } from "@/components/debug/screenshot/ScreenshotUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
	type ComparisonResult,
	canvasToDataUrl,
	compareImages,
	type DetectedRegion,
	detectBoardRegion,
	extractAndResizeRegion,
	extractWithManualAdjustment,
	fileToDataUrl,
	getImageDataFromDataUrl,
	getImageDataFromFile,
	loadImageFromDataUrl,
	loadImageFromFile,
	type ManualAdjustment as ManualAdjustmentType,
	type ViewMode,
} from "@/lib/screenshot";
import { generateDebugPageMeta } from "@/lib/seo";
import { type BoardData, decodeStgy, parseBoardData } from "@/lib/stgy";

const seo = generateDebugPageMeta("Screenshot Comparison Debug");

export const Route = createFileRoute("/debug-screenshot")({
	component: ScreenshotDebugPage,
	head: () => seo,
});

/** サンプルファイルパス */
const SAMPLE_SCREENSHOT = "/assets/screenshots/1.png";
const SAMPLE_STGY_CODE =
	"[stgy:a-eFMQJgHhwm3PyeNb0MaapuluKTcgLk0bRyPO-2b-Gb4eCiP3kAQE9Tirq-tzLyXbmsjShbHzif29GZ9TVpMdTxJGlmEzLHHccbjk2WC]";

function ScreenshotDebugPage() {
	// Screenshot state
	const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
	const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
	const [extractedImageUrl, setExtractedImageUrl] = useState<string | null>(
		null,
	);
	const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

	// Detection state
	const [detectedRegion, setDetectedRegion] = useState<DetectedRegion | null>(
		null,
	);
	const [isDetecting, setIsDetecting] = useState(false);
	const [detectionError, setDetectionError] = useState<string | null>(null);

	// Manual adjustment
	const [useManualMode, setUseManualMode] = useState(false);
	const [manualAdjustment, setManualAdjustment] =
		useState<ManualAdjustmentType>({
			offsetX: 0,
			offsetY: 0,
			scale: 1.0,
		});

	// stgy state
	const [stgyCode, setStgyCode] = useState("");
	const stgyCodeId = useId();
	const showBoundsId = useId();

	// View settings
	const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
	const [overlayOpacity, setOverlayOpacity] = useState(50);
	const [showDetectionBounds, setShowDetectionBounds] = useState(true);

	// Comparison result
	const [comparisonResult, setComparisonResult] =
		useState<ComparisonResult | null>(null);
	const [isComparing, setIsComparing] = useState(false);
	const svgContainerRef = useRef<HTMLDivElement>(null);

	// Parse stgy code
	const boardData = useMemo((): BoardData | null => {
		if (!stgyCode.trim()) return null;
		try {
			const binary = decodeStgy(stgyCode.trim());
			return parseBoardData(binary);
		} catch {
			return null;
		}
	}, [stgyCode]);

	const stgyError = useMemo((): string | null => {
		if (!stgyCode.trim()) return null;
		try {
			const binary = decodeStgy(stgyCode.trim());
			parseBoardData(binary);
			return null;
		} catch (e) {
			return e instanceof Error ? e.message : "Unknown error";
		}
	}, [stgyCode]);

	// Handle file selection
	const handleFileSelect = useCallback(async (file: File) => {
		setScreenshotFile(file);
		setDetectionError(null);
		setDetectedRegion(null);
		setExtractedImageUrl(null);

		try {
			// Load original image
			const dataUrl = await fileToDataUrl(file);
			setOriginalImageUrl(dataUrl);

			// Get image dimensions
			const img = await loadImageFromFile(file);
			setImageSize({ width: img.width, height: img.height });

			// Auto-detect board region
			setIsDetecting(true);
			const imageData = await getImageDataFromFile(file);
			const region = detectBoardRegion(imageData);

			if (region) {
				setDetectedRegion(region);
				// Extract region
				const canvas = extractAndResizeRegion(img, region);
				setExtractedImageUrl(canvasToDataUrl(canvas));
			} else {
				setDetectionError("Board region not detected. Try manual mode.");
				setUseManualMode(true);
			}
		} catch (e) {
			setDetectionError(
				e instanceof Error ? e.message : "Failed to process image",
			);
		} finally {
			setIsDetecting(false);
		}
	}, []);

	// Handle load sample
	const handleLoadSample = useCallback(async () => {
		try {
			const response = await fetch(SAMPLE_SCREENSHOT);
			if (!response.ok) {
				throw new Error(`Failed to load sample: ${response.status}`);
			}
			const blob = await response.blob();
			const file = new File([blob], "sample-screenshot.png", {
				type: "image/png",
			});
			handleFileSelect(file);
			setStgyCode(SAMPLE_STGY_CODE);
		} catch (e) {
			setDetectionError(
				e instanceof Error ? e.message : "Failed to load sample",
			);
		}
	}, [handleFileSelect]);

	// Re-detect when manual mode toggled
	const handleRunDetection = useCallback(async () => {
		if (!originalImageUrl) return;

		setIsDetecting(true);
		setDetectionError(null);

		try {
			const img = await loadImageFromDataUrl(originalImageUrl);

			if (useManualMode) {
				// Use manual adjustment
				const canvas = extractWithManualAdjustment(img, manualAdjustment);
				setExtractedImageUrl(canvasToDataUrl(canvas));
				setDetectedRegion({
					x: 0,
					y: 0,
					width: img.width,
					height: img.height,
					confidence: 1,
					method: "manual",
				});
			} else {
				// Re-run auto detection
				const canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("Failed to get context");
				ctx.drawImage(img, 0, 0);
				const imageData = ctx.getImageData(0, 0, img.width, img.height);
				const region = detectBoardRegion(imageData);

				if (region) {
					setDetectedRegion(region);
					const extractedCanvas = extractAndResizeRegion(img, region);
					setExtractedImageUrl(canvasToDataUrl(extractedCanvas));
				} else {
					setDetectionError("Board region not detected. Try manual mode.");
				}
			}
		} catch (e) {
			setDetectionError(e instanceof Error ? e.message : "Detection failed");
		} finally {
			setIsDetecting(false);
		}
	}, [originalImageUrl, useManualMode, manualAdjustment]);

	// Update extraction when manual adjustment changes
	useEffect(() => {
		if (!useManualMode || !originalImageUrl) return;

		const updateExtraction = async () => {
			try {
				const img = await loadImageFromDataUrl(originalImageUrl);
				const canvas = extractWithManualAdjustment(img, manualAdjustment);
				setExtractedImageUrl(canvasToDataUrl(canvas));
			} catch {
				// Ignore errors during adjustment
			}
		};

		const timer = setTimeout(updateExtraction, 100);
		return () => clearTimeout(timer);
	}, [useManualMode, originalImageUrl, manualAdjustment]);

	// Calculate comparison when both images are available
	const handleCompare = useCallback(async () => {
		if (!extractedImageUrl || !stgyCode.trim()) return;

		setIsComparing(true);
		try {
			// Get screenshot ImageData
			const screenshotImageData =
				await getImageDataFromDataUrl(extractedImageUrl);

			// Get rendered image from server API as PNG
			const encodedCode = encodeURIComponent(stgyCode.trim());
			const response = await fetch(`/image?stgy=${encodedCode}&format=png`);
			if (!response.ok) {
				throw new Error(`Server error: ${response.status}`);
			}
			const blob = await response.blob();
			const renderedUrl = URL.createObjectURL(blob);
			const renderedImageData = await getImageDataFromDataUrl(renderedUrl);
			URL.revokeObjectURL(renderedUrl);

			// Compare images
			const result = compareImages(screenshotImageData, renderedImageData);
			setComparisonResult(result);
		} catch (e) {
			console.error("Comparison failed:", e);
			setComparisonResult(null);
		} finally {
			setIsComparing(false);
		}
	}, [extractedImageUrl, stgyCode]);

	// Auto-compare when both images change
	useEffect(() => {
		if (extractedImageUrl && stgyCode.trim()) {
			// Small delay to allow server response
			const timer = setTimeout(handleCompare, 500);
			return () => clearTimeout(timer);
		}
		setComparisonResult(null);
	}, [extractedImageUrl, stgyCode, handleCompare]);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<DebugHeader
				title="Screenshot Comparison Debug"
				description="Compare game screenshots with rendered stgy code"
			/>

			<main className="p-4 space-y-4 max-w-7xl mx-auto">
				{/* Input Section */}
				<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Screenshot Upload */}
					<div className="bg-card border border-border rounded-lg p-4">
						<ScreenshotUploader
							onFileSelect={handleFileSelect}
							onLoadSample={handleLoadSample}
							currentFileName={screenshotFile?.name ?? null}
						/>
					</div>

					{/* stgy Code Input */}
					<div className="bg-card border border-border rounded-lg p-4">
						<Label htmlFor={stgyCodeId}>stgy Code</Label>
						<Textarea
							id={stgyCodeId}
							value={stgyCode}
							onChange={(e) => setStgyCode(e.target.value)}
							placeholder="[stgy:a...]"
							className="h-32 font-mono text-sm mt-2"
						/>
						{stgyError && (
							<p className="text-destructive text-xs mt-2">{stgyError}</p>
						)}
					</div>
				</section>

				{/* Detection Controls */}
				{originalImageUrl && (
					<section className="bg-card border border-border rounded-lg p-4">
						<div className="flex flex-wrap items-center gap-4">
							{/* Mode toggle */}
							<div className="flex items-center gap-2">
								<Button
									variant={!useManualMode ? "default" : "outline"}
									size="sm"
									onClick={() => setUseManualMode(false)}
								>
									<ScanSearch className="size-4 mr-1" />
									Auto Detect
								</Button>
								<Button
									variant={useManualMode ? "default" : "outline"}
									size="sm"
									onClick={() => setUseManualMode(true)}
								>
									<Settings2 className="size-4 mr-1" />
									Manual
								</Button>
							</div>

							{/* Re-detect button */}
							<Button
								variant="outline"
								size="sm"
								onClick={handleRunDetection}
								disabled={isDetecting}
							>
								{isDetecting ? "Detecting..." : "Re-detect"}
							</Button>

							{/* Detection info */}
							{detectedRegion && !useManualMode && (
								<div className="flex items-center gap-2 text-sm">
									<Badge variant="secondary">
										Confidence: {(detectedRegion.confidence * 100).toFixed(0)}%
									</Badge>
									<span className="text-muted-foreground">
										Region: {detectedRegion.width}x{detectedRegion.height} @ (
										{detectedRegion.x}, {detectedRegion.y})
									</span>
								</div>
							)}

							{/* Show detection bounds checkbox */}
							<div className="flex items-center gap-2 ml-auto">
								<Checkbox
									id={showBoundsId}
									checked={showDetectionBounds}
									onCheckedChange={(v) => setShowDetectionBounds(v === true)}
								/>
								<Label htmlFor={showBoundsId} className="text-sm">
									Show bounds
								</Label>
							</div>
						</div>

						{/* Manual adjustment controls */}
						{useManualMode && (
							<div className="mt-4 pt-4 border-t border-border">
								<ManualAdjustment
									adjustment={manualAdjustment}
									onChange={setManualAdjustment}
									imageWidth={imageSize.width}
									imageHeight={imageSize.height}
								/>
							</div>
						)}
					</section>
				)}

				{/* Error display */}
				{detectionError && (
					<div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>{detectionError}</p>
					</div>
				)}

				{/* Original image with detection overlay */}
				{originalImageUrl && showDetectionBounds && detectedRegion && (
					<section className="bg-card border border-border rounded-lg p-4">
						<h2 className="text-lg font-semibold mb-4">
							Detection Result (Original Image)
						</h2>
						<div className="overflow-auto">
							<div
								className="relative inline-block"
								style={{ maxWidth: "100%" }}
							>
								<img
									src={originalImageUrl}
									alt="Original screenshot"
									style={{ maxWidth: "100%", height: "auto" }}
								/>
								{/* Detection overlay */}
								<div
									className="absolute border-2 border-cyan-500 bg-cyan-500/20 pointer-events-none"
									style={{
										left: `${(detectedRegion.x / imageSize.width) * 100}%`,
										top: `${(detectedRegion.y / imageSize.height) * 100}%`,
										width: `${(detectedRegion.width / imageSize.width) * 100}%`,
										height: `${(detectedRegion.height / imageSize.height) * 100}%`,
									}}
								/>
							</div>
						</div>
					</section>
				)}

				{/* View Mode Controls */}
				{(extractedImageUrl || boardData) && (
					<section className="bg-card border border-border rounded-lg p-4">
						<div className="flex flex-wrap items-center gap-4">
							{/* View mode buttons */}
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">View:</span>
								<div className="flex gap-1">
									<Button
										variant={
											viewMode === "side-by-side" ? "default" : "outline"
										}
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
										<SwatchBook className="size-4 mr-1" />
										Diff
									</Button>
									<Button
										variant={viewMode === "swipe" ? "default" : "outline"}
										size="sm"
										onClick={() => setViewMode("swipe")}
									>
										Swipe
									</Button>
								</div>
							</div>

							{/* Overlay opacity slider */}
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
				)}

				{/* Comparison View */}
				{(extractedImageUrl || boardData) && (
					<section className="bg-card border border-border rounded-lg p-4">
						<h2 className="text-lg font-semibold mb-4">Comparison</h2>
						<ComparisonView
							screenshotDataUrl={extractedImageUrl}
							boardData={boardData}
							viewMode={viewMode}
							overlayOpacity={overlayOpacity}
							renderedContainerRef={svgContainerRef}
						/>
					</section>
				)}

				{/* Match Score */}
				{comparisonResult && (
					<section className="bg-card border border-border rounded-lg p-4">
						<h2 className="text-lg font-semibold mb-4">Match Score</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div className="bg-muted p-4 rounded-lg text-center">
								<p className="text-3xl font-bold text-primary">
									{comparisonResult.matchPercentage.toFixed(1)}%
								</p>
								<p className="text-sm text-muted-foreground">Match Rate</p>
							</div>
							<div className="bg-muted p-4 rounded-lg text-center">
								<p className="text-2xl font-mono">
									{comparisonResult.diffPixelCount.toLocaleString()}
								</p>
								<p className="text-sm text-muted-foreground">
									Different Pixels
								</p>
							</div>
							<div className="bg-muted p-4 rounded-lg text-center">
								<p className="text-2xl font-mono">
									{comparisonResult.totalPixels.toLocaleString()}
								</p>
								<p className="text-sm text-muted-foreground">Total Pixels</p>
							</div>
							<div className="bg-muted p-4 rounded-lg text-center">
								<p className="text-2xl font-mono">
									{comparisonResult.averageColorDiff.toFixed(1)}
								</p>
								<p className="text-sm text-muted-foreground">Avg Color Diff</p>
							</div>
						</div>
						{isComparing && (
							<p className="text-sm text-muted-foreground mt-2">
								Calculating...
							</p>
						)}
					</section>
				)}
			</main>
		</div>
	);
}
