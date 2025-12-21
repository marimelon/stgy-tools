/**
 * クライアント vs サーバー レンダリング比較デバッグページ
 * 両者の差異を視覚的に確認できる
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback, useId } from "react";
import { AlertCircle, Eye, EyeOff, Layers, SplitSquareHorizontal, Download } from "lucide-react";
import { decodeStgy, parseBoardData, ObjectNames } from "@/lib/stgy";
import type { BoardData, BoardObject } from "@/lib/stgy";
import { BoardViewer } from "@/components/board";
import { DebugHeader } from "@/components/debug/DebugHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/debug-render")({
	component: RenderDebugPage,
});

/** ビューモード */
type ViewMode = "side-by-side" | "overlay" | "diff";

/** デフォルトのサンプルコード */
const SAMPLE_CODES = {
	"基本 (ウェイマーク)": "[stgy:a0OcAwAYAfwgAFYAFBAAZYTLdYTLdYTLdYTLdYTLdYTLdYTLd]",
	"AoE攻撃": "[stgy:a0ScAwAYAfwJAAAHAGQAAMgA+g==]",
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

	// stgyコードをパース
	const parseResult = useMemo(() => {
		if (!inputCode.trim()) return null;
		try {
			const binary = decodeStgy(inputCode.trim());
			const boardData = parseBoardData(binary);
			return { boardData, error: null };
		} catch (e) {
			const message = e instanceof Error ? e.message : "不明なエラー";
			return { boardData: null, error: message };
		}
	}, [inputCode]);

	// サーバーからSVGを取得
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
			// キャッシュバスティング用のタイムスタンプを追加
			const timestamp = Date.now();
			const response = await fetch(`/image?code=${encodedCode}&format=svg&_t=${timestamp}`);
			
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}
			
			const svgText = await response.text();
			setServerSvg(svgText);
		} catch (e) {
			const message = e instanceof Error ? e.message : "不明なエラー";
			setServerError(message);
			setServerSvg(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// コードが変わったらサーバーSVGを再取得
	useEffect(() => {
		const timer = setTimeout(() => {
			fetchServerSvg(inputCode);
		}, 500); // デバウンス
		return () => clearTimeout(timer);
	}, [inputCode, fetchServerSvg]);

	// サンプルコードを適用
	const applySampleCode = (code: string) => {
		setInputCode(code);
	};

	// SVGをダウンロード
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
				description="クライアント側とサーバー側のレンダリング差異を確認"
			/>

			<main className="p-4 space-y-4 max-w-7xl mx-auto">
				{/* 入力エリア */}
				<section className="bg-card border border-border rounded-lg p-4">
					<div className="flex items-center justify-between mb-2">
						<Label htmlFor="input-code">stgyコードを入力:</Label>
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

				{/* コントロールパネル */}
				<section className="bg-card border border-border rounded-lg p-4">
					<div className="flex flex-wrap items-center gap-4">
						{/* ビューモード切り替え */}
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">表示モード:</span>
							<div className="flex gap-1">
								<Button
									variant={viewMode === "side-by-side" ? "default" : "outline"}
									size="sm"
									onClick={() => setViewMode("side-by-side")}
								>
									<SplitSquareHorizontal className="size-4 mr-1" />
									横並び
								</Button>
								<Button
									variant={viewMode === "overlay" ? "default" : "outline"}
									size="sm"
									onClick={() => setViewMode("overlay")}
								>
									<Layers className="size-4 mr-1" />
									重ね合わせ
								</Button>
								<Button
									variant={viewMode === "diff" ? "default" : "outline"}
									size="sm"
									onClick={() => setViewMode("diff")}
								>
									差分
								</Button>
							</div>
						</div>

						{/* 表示切り替え */}
						<div className="flex items-center gap-2">
							<Button
								variant={showClient ? "default" : "outline"}
								size="sm"
								onClick={() => setShowClient(!showClient)}
							>
								{showClient ? <Eye className="size-4 mr-1" /> : <EyeOff className="size-4 mr-1" />}
								Client
							</Button>
							<Button
								variant={showServer ? "default" : "outline"}
								size="sm"
								onClick={() => setShowServer(!showServer)}
							>
								{showServer ? <Eye className="size-4 mr-1" /> : <EyeOff className="size-4 mr-1" />}
								Server
							</Button>
						</div>

						{/* オーバーレイ透過度 */}
						{viewMode === "overlay" && (
							<div className="flex items-center gap-2 flex-1 max-w-xs">
								<span className="text-sm text-muted-foreground whitespace-nowrap">
									透過度:
								</span>
								<Slider
									value={[overlayOpacity]}
									onValueChange={([v]) => setOverlayOpacity(v)}
									min={0}
									max={100}
									step={1}
									className="flex-1"
								/>
								<span className="text-sm font-mono w-10">{overlayOpacity}%</span>
							</div>
						)}
					</div>
				</section>

				{/* エラー表示 */}
				{parseResult?.error && (
					<div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>クライアント側エラー: {parseResult.error}</p>
					</div>
				)}
				{serverError && (
					<div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>サーバー側エラー: {serverError}</p>
					</div>
				)}

				{/* レンダリング比較 */}
				{(parseResult?.boardData || serverSvg) && (
					<section className="bg-card border border-border rounded-lg p-4">
						<h2 className="text-lg font-semibold mb-4">レンダリング結果</h2>

						{viewMode === "side-by-side" && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* クライアント側 */}
								{showClient && (
									<RenderPanel
										title="Client (React)"
										subtitle="BoardViewer コンポーネント"
										loading={false}
									>
										{parseResult?.boardData ? (
											<BoardViewer boardData={parseResult.boardData} scale={1} />
										) : (
											<EmptyState message="有効なstgyコードを入力してください" />
										)}
									</RenderPanel>
								)}

								{/* サーバー側 */}
								{showServer && (
									<RenderPanel
										title="Server (SVG)"
										subtitle="svgRenderer.tsx"
										loading={isLoading}
										onDownload={serverSvg ? () => downloadSvg(serverSvg, "server-render.svg") : undefined}
									>
										{serverSvg ? (
											<div
												className="flex justify-center"
												// biome-ignore lint/security/noDangerouslySetInnerHtml: サーバーから取得したSVGを表示
												dangerouslySetInnerHTML={{ __html: serverSvg }}
											/>
										) : (
											<EmptyState message={isLoading ? "読み込み中..." : "有効なstgyコードを入力してください"} />
										)}
									</RenderPanel>
								)}
							</div>
						)}

						{viewMode === "overlay" && (
							<RenderPanel
								title="オーバーレイ比較"
								subtitle={`Client: ${100 - overlayOpacity}% / Server: ${overlayOpacity}%`}
								loading={isLoading}
							>
								<div className="relative" style={{ width: 512, height: 384 }}>
									{/* クライアント側（下レイヤー） */}
									{showClient && parseResult?.boardData && (
										<div
											className="absolute inset-0"
											style={{ opacity: (100 - overlayOpacity) / 100 }}
										>
											<BoardViewer boardData={parseResult.boardData} scale={1} />
										</div>
									)}
									{/* サーバー側（上レイヤー） */}
									{showServer && serverSvg && (
										<div
											className="absolute inset-0 flex justify-center"
											style={{ opacity: overlayOpacity / 100 }}
											// biome-ignore lint/security/noDangerouslySetInnerHtml: サーバーから取得したSVGを表示
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

				{/* オブジェクト一覧 */}
				{parseResult?.boardData && (
					<section className="bg-card border border-border rounded-lg p-4">
						<h2 className="text-lg font-semibold mb-4">
							オブジェクト一覧 ({parseResult.boardData.objects.length}個)
						</h2>
						<div className="overflow-x-auto">
							<ObjectTable objects={parseResult.boardData.objects} />
						</div>
					</section>
				)}

				{/* SVGソース比較 */}
				{serverSvg && (
					<section className="bg-card border border-border rounded-lg p-4">
						<h2 className="text-lg font-semibold mb-4">サーバーSVGソース</h2>
						<pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre">
							{serverSvg}
						</pre>
					</section>
				)}
			</main>
		</div>
	);
}

/** レンダリングパネル */
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
					{loading && (
						<Badge variant="secondary">Loading...</Badge>
					)}
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

/** 空の状態表示 */
function EmptyState({ message }: { message: string }) {
	return (
		<div className="flex items-center justify-center w-[512px] h-[384px] bg-card border border-dashed border-border rounded">
			<p className="text-muted-foreground">{message}</p>
		</div>
	);
}

/** 差分ビュー */
function DiffView({
	boardData,
	serverSvg,
}: {
	boardData: BoardData;
	serverSvg: string;
}) {
	// 差分モード: クライアントを緑、サーバーを赤で重ねる
	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				差分ハイライト: <span className="text-green-500">緑=クライアントのみ</span>, <span className="text-red-500">赤=サーバーのみ</span>, 一致部分は通常色
			</p>
			<div className="relative" style={{ width: 512, height: 384 }}>
				{/* サーバー側（赤フィルター） */}
				<div
					className="absolute inset-0 flex justify-center"
					style={{ 
						mixBlendMode: "multiply",
						filter: "hue-rotate(0deg) saturate(200%)",
					}}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: サーバーから取得したSVGを表示
					dangerouslySetInnerHTML={{ __html: serverSvg }}
				/>
				{/* クライアント側（緑フィルター） */}
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
				※ 差分表示はブレンドモードを使用した近似表示です。完全に一致している場合は色の変化がありません。
			</p>
		</div>
	);
}

/** オブジェクトテーブル */
function ObjectTable({ objects }: { objects: BoardObject[] }) {
	return (
		<table className="w-full text-sm">
			<thead>
				<tr className="border-b border-border text-left">
					<th className="px-2 py-1">#</th>
					<th className="px-2 py-1">ObjectId</th>
					<th className="px-2 py-1">名前</th>
					<th className="px-2 py-1">位置</th>
					<th className="px-2 py-1">回転</th>
					<th className="px-2 py-1">サイズ</th>
					<th className="px-2 py-1">色</th>
					<th className="px-2 py-1">フラグ</th>
					<th className="px-2 py-1">パラメータ</th>
				</tr>
			</thead>
			<tbody>
				{objects.map((obj, idx) => (
					<tr key={`${obj.objectId}-${obj.position.x}-${obj.position.y}-${idx}`} className="border-b border-border/50 hover:bg-muted/50">
						<td className="px-2 py-1 font-mono text-muted-foreground">{idx}</td>
						<td className="px-2 py-1 font-mono">{obj.objectId}</td>
						<td className="px-2 py-1">{ObjectNames[obj.objectId] ?? "不明"}</td>
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
								{!obj.flags.visible && <Badge variant="outline" className="text-xs">非表示</Badge>}
								{obj.flags.flipHorizontal && <Badge variant="outline" className="text-xs">左右反転</Badge>}
								{obj.flags.flipVertical && <Badge variant="outline" className="text-xs">上下反転</Badge>}
								{obj.flags.locked && <Badge variant="outline" className="text-xs">ロック</Badge>}
							</div>
						</td>
						<td className="px-2 py-1 font-mono text-xs">
							{[obj.param1, obj.param2, obj.param3]
								.filter((p) => p !== undefined)
								.map((p, i) => `p${i + 1}=${p}`)
								.join(", ") || "-"}
							{obj.text && <span className="ml-1 text-muted-foreground">text="{obj.text}"</span>}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

