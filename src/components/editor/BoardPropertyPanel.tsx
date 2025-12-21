/**
 * ボードプロパティパネルコンポーネント
 *
 * shadcn/ui ベースのボード設定パネル
 */

import type { BoardData, BackgroundId } from "@/lib/stgy";
import { BackgroundId as BgId } from "@/lib/stgy";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="panel h-full overflow-y-auto">
      <div className="panel-header">
        <h2 className="panel-title">ボード設定</h2>
      </div>

      <div className="p-4 space-y-1">
        {/* ボード名 */}
        <PropertySection title="ボード名">
          <Input
            type="text"
            value={board.name}
            onChange={(e) => onUpdateMeta({ name: e.target.value })}
            onBlur={() => onCommitHistory("ボード名変更")}
            placeholder="ボード名を入力"
          />
        </PropertySection>

        {/* 背景 */}
        <PropertySection title="背景">
          <Select
            value={String(board.backgroundId)}
            onValueChange={(value) => {
              onUpdateMeta({ backgroundId: Number(value) as BackgroundId });
              onCommitHistory("背景変更");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BACKGROUND_NAMES).map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertySection>

        {/* ボードサイズ（参考情報） */}
        <PropertySection title="サイズ">
          <div className="text-sm font-medium font-mono">
            <span className="text-primary">{board.width}</span>
            <span className="text-muted-foreground"> × </span>
            <span className="text-primary">{board.height}</span>
          </div>
          <div className="text-xs mt-1.5 text-muted-foreground">
            ※エクスポート時に自動計算されます
          </div>
        </PropertySection>
      </div>
    </div>
  );
}
