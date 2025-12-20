import { createFileRoute } from "@tanstack/react-router";
import { ObjectNames, ObjectIds } from "@/lib/stgy";
import type { BoardObject } from "@/lib/stgy";
import { ObjectRenderer } from "@/components/board";

export const Route = createFileRoute("/debug")({ component: DebugPage });

/** 全オブジェクトIDのリスト */
const ALL_OBJECT_IDS = Object.keys(ObjectNames)
  .map(Number)
  .sort((a, b) => a - b);

/** デフォルトのオブジェクトを生成 */
function createDefaultObject(objectId: number): BoardObject {
  return {
    objectId,
    flags: {
      visible: true,
      flipHorizontal: false,
      flipVertical: false,
      unlocked: true,
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
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 p-4">
        <h1 className="text-2xl font-bold">Object ID Debug View</h1>
        <p className="text-slate-400 text-sm mt-1">
          全{ALL_OBJECT_IDS.length}種類のオブジェクトID描画確認
        </p>
      </header>

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
    <div className="bg-slate-800 rounded-lg p-2 flex flex-col items-center">
      <svg
        width={80}
        height={80}
        viewBox="0 0 80 80"
        className="bg-slate-700 rounded"
      >
        <ObjectRenderer
          object={object}
          index={0}
          showBoundingBox={false}
          selected={false}
        />
      </svg>
      <div className="mt-2 text-center">
        <div className="text-xs font-mono text-slate-400">ID: {objectId}</div>
        <div className="text-xs text-slate-300 truncate max-w-[80px]" title={name}>
          {name}
        </div>
      </div>
    </div>
  );
}
