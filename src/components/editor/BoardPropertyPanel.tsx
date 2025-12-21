/**
 * ボードプロパティパネルコンポーネント
 *
 * ボード設定（名前、背景など）を編集
 */

import type { BoardData, BackgroundId } from "@/lib/stgy";
import { BackgroundId as BgId } from "@/lib/stgy";
import { PropertySection } from "./FormInputs";

/** 背景名のマッピング */
const BACKGROUND_NAMES: Record<BackgroundId, string> = {
  [BgId.None]: "なし",
  [BgId.FullCheck]: "全面チェック",
  [BgId.CircleCheck]: "円形チェック",
  [BgId.SquareCheck]: "四角チェック",
  [BgId.FullGray]: "全面グレー",
  [BgId.CircleGray]: "円形グレー",
  [BgId.SquareGray]: "四角グレー",
};

/**
 * ボードプロパティパネルのProps
 */
export interface BoardPropertyPanelProps {
  /** ボードデータ */
  board: BoardData;
  /** メタデータ更新時のコールバック */
  onUpdateMeta: (updates: { name?: string; backgroundId?: BackgroundId }) => void;
  /** 履歴コミット時のコールバック */
  onCommitHistory: (description: string) => void;
}

/**
 * ボードプロパティパネル
 */
export function BoardPropertyPanel({
  board,
  onUpdateMeta,
  onCommitHistory,
}: BoardPropertyPanelProps) {
  return (
    <div className="w-72 bg-slate-800 border-l border-slate-700 overflow-y-auto">
      <div className="p-3 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-200">ボード設定</h2>
      </div>

      <div className="p-3 space-y-4">
        {/* ボード名 */}
        <PropertySection title="ボード名">
          <input
            type="text"
            value={board.name}
            onChange={(e) => onUpdateMeta({ name: e.target.value })}
            onBlur={() => onCommitHistory("ボード名変更")}
            placeholder="ボード名を入力"
            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </PropertySection>

        {/* 背景 */}
        <PropertySection title="背景">
          <select
            value={board.backgroundId}
            onChange={(e) => {
              onUpdateMeta({ backgroundId: Number(e.target.value) as BackgroundId });
              onCommitHistory("背景変更");
            }}
            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {Object.entries(BACKGROUND_NAMES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </PropertySection>

        {/* ボードサイズ（参考情報） */}
        <PropertySection title="サイズ">
          <div className="text-sm text-slate-300">
            {board.width} × {board.height}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ※エクスポート時に自動計算されます
          </div>
        </PropertySection>
      </div>
    </div>
  );
}
