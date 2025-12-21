import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BoardViewer } from "@/components/board";
import { decodeStgy, parseBoardData, ObjectNames } from "@/lib/stgy";
import type { BoardData, BoardObject } from "@/lib/stgy";

export const Route = createFileRoute("/")({ component: App });

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

function App() {
  const [stgyInput, setStgyInput] = useState(SAMPLE_STGY);
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBoundingBox, setShowBoundingBox] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedObject, setSelectedObject] = useState<BoardObject | null>(null);

  const handleDecode = () => {
    try {
      setError(null);
      const binary = decodeStgy(stgyInput.trim());
      const data = parseBoardData(binary);
      setBoardData(data);
      setSelectedIndex(null);
      setSelectedObject(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setBoardData(null);
    }
  };

  const handleSelectObject = (index: number | null, object: BoardObject | null) => {
    setSelectedIndex(index);
    setSelectedObject(object);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">Strategy Board Viewer</h1>
          <nav className="flex gap-4">
            <Link
              to="/editor"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium transition-colors"
            >
              エディタを開く
            </Link>
          </nav>
        </div>
      </header>

      <main className="p-4 max-w-6xl mx-auto">
        <div className="mb-6">
          <label htmlFor="stgy-input" className="block text-sm font-medium mb-2">
            stgyコードを入力:
          </label>
          <textarea
            id="stgy-input"
            value={stgyInput}
            onChange={(e) => setStgyInput(e.target.value)}
            className="w-full h-24 p-3 bg-slate-800 border border-slate-600 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="[stgy:a...]"
          />
          <button
            type="button"
            onClick={handleDecode}
            className="mt-3 px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium transition-colors"
          >
            表示
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {boardData && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">ボード情報</h2>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-slate-400">名前</dt>
                  <dd className="font-medium">{boardData.name || "(無題)"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">オブジェクト数</dt>
                  <dd className="font-medium">{boardData.objects.length}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">背景</dt>
                  <dd className="font-medium">{getBackgroundName(boardData.backgroundId)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex gap-4">
              {/* ボードビューアー */}
              <div className="p-4 bg-slate-800 rounded-lg flex-shrink-0">
                <div className="mb-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-bbox"
                    checked={showBoundingBox}
                    onChange={(e) => setShowBoundingBox(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <label htmlFor="show-bbox" className="text-sm text-slate-300">
                    バウンディングボックスを表示
                  </label>
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
              <div className="p-4 bg-slate-800 rounded-lg flex-1 min-w-[250px]">
                <h2 className="text-lg font-semibold mb-3">選択オブジェクト</h2>
                {selectedObject ? (
                  <SelectedObjectInfo index={selectedIndex!} object={selectedObject} />
                ) : (
                  <p className="text-slate-400 text-sm">オブジェクトをクリックして選択</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SelectedObjectInfo({ index, object }: { index: number; object: BoardObject }) {
  const objectName = ObjectNames[object.objectId] ?? "不明";

  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-slate-400">インデックス</dt>
        <dd className="font-mono">{index}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">オブジェクト名</dt>
        <dd className="font-medium">{objectName}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">オブジェクトID</dt>
        <dd className="font-mono">{object.objectId}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">位置</dt>
        <dd className="font-mono">
          ({object.position.x.toFixed(1)}, {object.position.y.toFixed(1)})
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">回転</dt>
        <dd className="font-mono">{object.rotation}°</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">サイズ</dt>
        <dd className="font-mono">{object.size}%</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-400">色</dt>
        <dd className="font-mono flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded border border-slate-600"
            style={{
              backgroundColor: `rgba(${object.color.r}, ${object.color.g}, ${object.color.b}, ${1 - object.color.opacity / 100})`,
            }}
          />
          RGB({object.color.r}, {object.color.g}, {object.color.b})
        </dd>
      </div>
      {object.text && (
        <div className="flex justify-between">
          <dt className="text-slate-400">テキスト</dt>
          <dd className="font-mono">"{object.text}"</dd>
        </div>
      )}
      {object.param1 !== undefined && (
        <div className="flex justify-between">
          <dt className="text-slate-400">パラメータ1</dt>
          <dd className="font-mono">{object.param1}</dd>
        </div>
      )}
      {object.param2 !== undefined && (
        <div className="flex justify-between">
          <dt className="text-slate-400">パラメータ2</dt>
          <dd className="font-mono">{object.param2}</dd>
        </div>
      )}
      <div className="pt-2 border-t border-slate-700">
        <dt className="text-slate-400 mb-1">フラグ</dt>
        <dd className="flex flex-wrap gap-1">
          {object.flags.visible && (
            <span className="px-2 py-0.5 bg-green-900/50 text-green-300 rounded text-xs">表示</span>
          )}
          {object.flags.flipHorizontal && (
            <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs">左右反転</span>
          )}
          {object.flags.flipVertical && (
            <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs">上下反転</span>
          )}
          {object.flags.unlocked && (
            <span className="px-2 py-0.5 bg-yellow-900/50 text-yellow-300 rounded text-xs">非ロック</span>
          )}
        </dd>
      </div>
    </dl>
  );
}
