import { createFileRoute } from "@tanstack/react-router";
import { ObjectRenderer } from "@/components/board";
import { DebugHeader } from "@/components/debug/DebugHeader";
import { generateDebugPageMeta } from "@/lib/seo";
import type { BoardObjectWithoutId } from "@/lib/stgy";
import { ObjectIds, ObjectNames } from "@/lib/stgy";

const seo = generateDebugPageMeta("Object ID Debug View");

export const Route = createFileRoute("/debug")({
	component: DebugPage,
	head: () => seo,
});

/** 全オブジェクトIDのリスト */
const ALL_OBJECT_IDS = Object.keys(ObjectNames)
	.map(Number)
	.sort((a, b) => a - b);

/** デフォルトのオブジェクトを生成（デバッグ用、IDなし） */
function createDefaultObject(objectId: number): BoardObjectWithoutId {
	return {
		objectId,
		flags: {
			visible: true,
			flipHorizontal: false,
			flipVertical: false,
			locked: false,
		},
		position: { x: 40, y: 40 },
		rotation: 0,
		size: 100,
		color: { r: 255, g: 100, b: 0, opacity: 0 },
		// 扇範囲攻撃のデフォルト角度
		param1: objectId === ObjectIds.ConeAoE ? 90 : undefined,
		// ドーナツ範囲攻撃のデフォルト内径
		param2: objectId === ObjectIds.DonutAoE ? 50 : undefined,
	};
}

function DebugPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<DebugHeader
				title="Object ID Debug View"
				description={`全${ALL_OBJECT_IDS.length}種類のオブジェクトID描画確認`}
			/>

			<main className="p-4">
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
					{ALL_OBJECT_IDS.map((objectId) => (
						<ObjectPreview key={objectId} objectId={objectId} />
					))}
				</div>
			</main>
		</div>
	);
}

function ObjectPreview({ objectId }: { objectId: number }) {
	const object = createDefaultObject(objectId);
	const name = ObjectNames[objectId] ?? "不明";

	return (
		<div className="bg-card border border-border rounded-lg p-2 flex flex-col items-center">
			<svg
				width={80}
				height={80}
				viewBox="0 0 80 80"
				className="bg-muted rounded"
				role="img"
				aria-label={`Object preview: ${name}`}
			>
				<ObjectRenderer
					object={{ ...object, id: `debug-${objectId}` }}
					selected={false}
				/>
			</svg>
			<div className="mt-2 text-center">
				<div className="text-xs font-mono text-muted-foreground">
					ID: {objectId}
				</div>
				<div className="text-xs truncate max-w-[80px]" title={name}>
					{name}
				</div>
			</div>
		</div>
	);
}
