/**
 * プロパティパネルコンポーネント
 *
 * 選択状態に応じてボード設定またはオブジェクトプロパティを表示
 */

import { useCallback } from "react";
import { useEditor } from "@/lib/editor";
import { BoardPropertyPanel } from "./BoardPropertyPanel";
import { ObjectPropertyPanel } from "./ObjectPropertyPanel";

/**
 * プロパティパネル
 *
 * オブジェクト未選択時はボード設定を表示し、
 * オブジェクト選択時はオブジェクトプロパティを表示
 */
export function PropertyPanel() {
  const { state, selectedObjects, updateObject, commitHistory, updateBoardMeta } = useEditor();
  const { selectedIndices, board } = state;

  // 単一選択のみ編集可能
  const selectedObject = selectedObjects.length === 1 ? selectedObjects[0] : null;
  const selectedIndex = selectedIndices.length === 1 ? selectedIndices[0] : null;

  // オブジェクト更新ハンドラ
  const handleUpdateObject = useCallback(
    (updates: Parameters<typeof updateObject>[1]) => {
      if (selectedIndex !== null) {
        updateObject(selectedIndex, updates);
      }
    },
    [selectedIndex, updateObject]
  );

  // オブジェクト未選択時はボード情報を表示
  if (!selectedObject || selectedIndex === null) {
    return (
      <BoardPropertyPanel
        board={board}
        onUpdateMeta={updateBoardMeta}
        onCommitHistory={commitHistory}
      />
    );
  }

  return (
    <ObjectPropertyPanel
      object={selectedObject}
      onUpdate={handleUpdateObject}
      onCommitHistory={commitHistory}
    />
  );
}


