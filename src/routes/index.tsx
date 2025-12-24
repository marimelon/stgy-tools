import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BoardViewer } from "@/components/board";
import { AppHeader } from "@/components/ui/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Footer } from "@/components/ui/Footer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateCommonMeta } from "@/lib/seo";
import type { BoardData, BoardObject } from "@/lib/stgy";
import { decodeStgy, ObjectNames, parseBoardData } from "@/lib/stgy";

const seo = generateCommonMeta("home");

export const Route = createFileRoute("/")({
	component: App,
	head: () => seo,
});

function getBackgroundName(id: number): string {
	const names: Record<number, string> = {
		1: "設定なし",
		2: "全面チェック",
		3: "円形チェック",
		4: "正方形チェック",
		5: "全面グレー",
		6: "円形グレー",
		7: "正方形グレー",
	};
	return names[id] ?? `不明 (${id})`;
}

const SAMPLE_STGY =
	"[stgy:a7AIxEt68bIksM7YvDMlkmKJL8iH2Eq-2vDUI+1PGMl9+UVD4FhAcsxS5tImN8GsSsHqSfbiqbA-P+yOUQ9unhordXjeMGL9gogzDY+BIgOtPiufNvO85+QJQtQ0HoGATs4AS6KNbAfZ0mBO0j7Xyr7DzEG8fCafOqcmj1p4mq-RTUxIVf5RqM+0GuS+XSB9CIBbHIKJoW3OvB8GEo0Z9+6TbKxdVBGwL5FY53igor8+TrbL7P2mEZwElDFDgDrmoxRYo-tH36+ipeUTp]";

/** デバウンス遅延時間 (ms) */
const DEBOUNCE_DELAY = 300;

function App() {
	const [stgyInput, setStgyInput] = useState(SAMPLE_STGY);
	const [boardData, setBoardData] = useState<BoardData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showBoundingBox, setShowBoundingBox] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
	const [selectedObject, setSelectedObject] = useState<BoardObject | null>(
		null,
	);
	const stgyInputId = useId();
	const showBboxId = useId();
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// 自動デコード関数
	const decodeBoardData = useCallback((input: string) => {
		if (!input.trim()) {
			setBoardData(null);
			setError(null);
			setSelectedIndex(null);
			setSelectedObject(null);
			return;
		}

		try {
			setError(null);
			const binary = decodeStgy(input.trim());
			const data = parseBoardData(binary);
			setBoardData(data);
			setSelectedIndex(null);
			setSelectedObject(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Unknown error");
			setBoardData(null);
		}
	}, []);

	// 入力変更時の自動デコード（デバウンス付き）
	useEffect(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(() => {
			decodeBoardData(stgyInput);
		}, DEBOUNCE_DELAY);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [stgyInput, decodeBoardData]);

	const handleSelectObject = (
		index: number | null,
		object: BoardObject | null,
	) => {
		setSelectedIndex(index);
		setSelectedObject(object);
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<AppHeader currentPage="viewer" title="STGY Tools Viewer" />

			<main className="p-4 max-w-6xl mx-auto">
				<div className="mb-6 space-y-3">
					<Label htmlFor={stgyInputId}>stgyコードを入力:</Label>
					<Textarea
						id={stgyInputId}
						value={stgyInput}
						onChange={(e) => setStgyInput(e.target.value)}
						className="h-24 font-mono text-sm"
						placeholder="[stgy:a...]"
					/>
				</div>

				{error && (
					<div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>{error}</p>
					</div>
				)}

				{boardData && (
					<div className="space-y-4">
						{/* ボード情報 */}
						<div className="p-4 bg-card border border-border rounded-lg">
							<h2 className="text-lg font-semibold mb-3 font-display">
								ボード情報
							</h2>
							<dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
								<div>
									<dt className="text-muted-foreground">名前</dt>
									<dd className="font-medium">{boardData.name || "(無題)"}</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">オブジェクト数</dt>
									<dd className="font-medium font-mono text-primary">
										{boardData.objects.length}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">背景</dt>
									<dd className="font-medium">
										{getBackgroundName(boardData.backgroundId)}
									</dd>
								</div>
							</dl>
						</div>

						<div className="flex gap-4 flex-col lg:flex-row">
							{/* ボードビューアー */}
							<div className="p-4 bg-card border border-border rounded-lg flex-shrink-0">
								<div className="mb-3 flex items-center gap-2">
									<Checkbox
										id={showBboxId}
										checked={showBoundingBox}
										onCheckedChange={(checked) =>
											setShowBoundingBox(checked === true)
										}
									/>
									<Label
										htmlFor={showBboxId}
										className="text-sm cursor-pointer"
									>
										バウンディングボックスを表示
									</Label>
								</div>
								<BoardViewer
									boardData={boardData}
									scale={1}
									showBoundingBox={showBoundingBox}
									selectedIndex={selectedIndex}
									onSelectObject={handleSelectObject}
								/>
							</div>

							{/* 選択オブジェクト情報 */}
							<div className="p-4 bg-card border border-border rounded-lg flex-1 min-w-[250px]">
								<h2 className="text-lg font-semibold mb-3 font-display">
									選択オブジェクト
								</h2>
								{selectedObject && selectedIndex !== null ? (
									<SelectedObjectInfo
										index={selectedIndex}
										object={selectedObject}
									/>
								) : (
									<p className="text-muted-foreground text-sm">
										オブジェクトをクリックして選択
									</p>
								)}
							</div>
						</div>
					</div>
				)}
			</main>

			<Footer />
		</div>
	);
}

function SelectedObjectInfo({
	index,
	object,
}: {
	index: number;
	object: BoardObject;
}) {
	const objectName = ObjectNames[object.objectId] ?? "不明";

	return (
		<dl className="space-y-2 text-sm">
			<div className="flex justify-between">
				<dt className="text-muted-foreground">インデックス</dt>
				<dd className="font-mono">{index}</dd>
			</div>
			<div className="flex justify-between">
				<dt className="text-muted-foreground">オブジェクト名</dt>
				<dd className="font-medium">{objectName}</dd>
			</div>
			<div className="flex justify-between">
				<dt className="text-muted-foreground">オブジェクトID</dt>
				<dd className="font-mono text-primary">{object.objectId}</dd>
			</div>
			<div className="flex justify-between">
				<dt className="text-muted-foreground">位置</dt>
				<dd className="font-mono">
					({object.position.x.toFixed(1)}, {object.position.y.toFixed(1)})
				</dd>
			</div>
			<div className="flex justify-between">
				<dt className="text-muted-foreground">回転</dt>
				<dd className="font-mono">{object.rotation}°</dd>
			</div>
			<div className="flex justify-between">
				<dt className="text-muted-foreground">サイズ</dt>
				<dd className="font-mono">{object.size}%</dd>
			</div>
			<div className="flex justify-between items-center">
				<dt className="text-muted-foreground">色</dt>
				<dd className="font-mono flex items-center gap-2">
					<span
						className="inline-block w-4 h-4 rounded border border-border"
						style={{
							backgroundColor: `rgba(${object.color.r}, ${object.color.g}, ${object.color.b}, ${1 - object.color.opacity / 100})`,
						}}
					/>
					RGB({object.color.r}, {object.color.g}, {object.color.b})
				</dd>
			</div>
			{object.text && (
				<div className="flex justify-between">
					<dt className="text-muted-foreground">テキスト</dt>
					<dd className="font-mono">"{object.text}"</dd>
				</div>
			)}
			{object.param1 !== undefined && (
				<div className="flex justify-between">
					<dt className="text-muted-foreground">パラメータ1</dt>
					<dd className="font-mono">{object.param1}</dd>
				</div>
			)}
			{object.param2 !== undefined && (
				<div className="flex justify-between">
					<dt className="text-muted-foreground">パラメータ2</dt>
					<dd className="font-mono">{object.param2}</dd>
				</div>
			)}
			<div className="pt-2 border-t border-border">
				<dt className="text-muted-foreground mb-2">フラグ</dt>
				<dd className="flex flex-wrap gap-1">
					{object.flags.visible && (
						<Badge
							variant="outline"
							className="bg-green-500/10 text-green-400 border-green-500/30"
						>
							表示
						</Badge>
					)}
					{object.flags.flipHorizontal && (
						<Badge
							variant="outline"
							className="bg-blue-500/10 text-blue-400 border-blue-500/30"
						>
							左右反転
						</Badge>
					)}
					{object.flags.flipVertical && (
						<Badge
							variant="outline"
							className="bg-blue-500/10 text-blue-400 border-blue-500/30"
						>
							上下反転
						</Badge>
					)}
					{object.flags.locked && (
						<Badge
							variant="outline"
							className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
						>
							ロック
						</Badge>
					)}
				</dd>
			</div>
		</dl>
	);
}
