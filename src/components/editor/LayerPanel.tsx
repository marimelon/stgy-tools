/**
 * レイヤーパネルコンポーネント
 *
 * オブジェクトのレイヤー順を表示・編集（グループ対応）
 */

import { useCallback, useMemo } from "react";
import { useEditor } from "@/lib/editor";
import { ObjectNames } from "@/lib/stgy";
import type { ObjectGroup } from "@/lib/editor/types";

/**
 * レイヤーアイテムの表示データ
 */
interface LayerItem {
  type: "object" | "group-header";
  index?: number; // object の場合
  group?: ObjectGroup; // group-header の場合
  isInGroup: boolean;
  groupId?: string;
}

/**
 * レイヤーパネル
 */
export function LayerPanel() {
  const {
    state,
    selectObject,
    updateObject,
    commitHistory,
    selectGroup,
    ungroup,
    toggleGroupCollapse,
    getGroupForObject,
  } = useEditor();
  const { board, selectedIndices, groups } = state;
  const { objects } = board;

  // レイヤーアイテムのリストを構築（グループを考慮）
  const layerItems = useMemo<LayerItem[]>(() => {
    const items: LayerItem[] = [];
    const processedIndices = new Set<number>();

    for (let i = 0; i < objects.length; i++) {
      if (processedIndices.has(i)) continue;

      const group = getGroupForObject(i);

      if (group) {
        // グループの最初のオブジェクトでグループヘッダーを追加
        const firstInGroup = Math.min(...group.objectIndices);
        if (i === firstInGroup) {
          items.push({
            type: "group-header",
            group,
            isInGroup: false,
            groupId: group.id,
          });

          // グループ内のオブジェクトを追加（折りたたまれていなければ）
          if (!group.collapsed) {
            for (const idx of group.objectIndices.sort((a, b) => a - b)) {
              items.push({
                type: "object",
                index: idx,
                isInGroup: true,
                groupId: group.id,
              });
              processedIndices.add(idx);
            }
          } else {
            // 折りたたまれている場合はインデックスだけ記録
            for (const idx of group.objectIndices) {
              processedIndices.add(idx);
            }
          }
        }
      } else {
        // グループに属していないオブジェクト
        items.push({
          type: "object",
          index: i,
          isInGroup: false,
        });
      }
    }

    return items;
  }, [objects, groups, getGroupForObject]);

  const handleToggleVisibility = useCallback(
    (index: number) => {
      const obj = objects[index];
      updateObject(index, {
        flags: { ...obj.flags, visible: !obj.flags.visible },
      });
      commitHistory("表示状態変更");
    },
    [objects, updateObject, commitHistory]
  );

  const handleSelectObject = useCallback(
    (index: number, e: React.MouseEvent) => {
      const additive = e.ctrlKey || e.metaKey;
      selectObject(index, additive);
    },
    [selectObject]
  );

  const handleSelectGroup = useCallback(
    (groupId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectGroup(groupId);
    },
    [selectGroup]
  );

  const handleUngroupClick = useCallback(
    (groupId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      ungroup(groupId);
    },
    [ungroup]
  );

  const handleToggleCollapse = useCallback(
    (groupId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      toggleGroupCollapse(groupId);
    },
    [toggleGroupCollapse]
  );

  return (
    <div className="bg-slate-800 border-t border-slate-700 flex flex-col max-h-64">
      <div className="p-2 border-b border-slate-700 flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-200">レイヤー</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="p-3 text-sm text-slate-500 text-center">
            オブジェクトがありません
          </div>
        ) : (
          <div className="py-1">
            {layerItems.map((item, idx) => {
              if (item.type === "group-header" && item.group) {
                const group = item.group;
                const allSelected = group.objectIndices.every((i) =>
                  selectedIndices.includes(i)
                );

                return (
                  <div
                    key={`group-${group.id}`}
                    onClick={(e) => handleSelectGroup(group.id, e)}
                    className={`
                      flex items-center gap-2 px-2 py-1 mx-1 rounded cursor-pointer
                      transition-colors select-none
                      ${allSelected ? "bg-purple-600/30 border border-purple-500/50" : "hover:bg-slate-700 border border-transparent"}
                    `}
                  >
                    {/* 折りたたみトグル */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleCollapse(group.id, e)}
                      className="text-slate-400 hover:text-slate-200 text-xs w-4"
                    >
                      {group.collapsed ? "▶" : "▼"}
                    </button>

                    {/* グループアイコン */}
                    <span className="text-purple-400">⊞</span>

                    {/* グループ名 */}
                    <span className="flex-1 text-xs text-purple-300 truncate">
                      グループ ({group.objectIndices.length})
                    </span>

                    {/* グループ解除ボタン */}
                    <button
                      type="button"
                      onClick={(e) => handleUngroupClick(group.id, e)}
                      className="text-slate-500 hover:text-slate-300 text-xs"
                      title="グループ解除"
                    >
                      ✕
                    </button>
                  </div>
                );
              }

              if (item.type === "object" && item.index !== undefined) {
                const index = item.index;
                const obj = objects[index];
                const isSelected = selectedIndices.includes(index);
                const name = ObjectNames[obj.objectId] ?? `ID: ${obj.objectId}`;

                return (
                  <div
                    key={`obj-${index}`}
                    onClick={(e) => handleSelectObject(index, e)}
                    className={`
                      flex items-center gap-2 px-2 py-1 mx-1 rounded cursor-pointer
                      transition-colors select-none
                      ${item.isInGroup ? "ml-4" : ""}
                      ${isSelected ? "bg-cyan-600/30 border border-cyan-500/50" : "hover:bg-slate-700 border border-transparent"}
                    `}
                  >
                    {/* ドラッグハンドル */}
                    <span className="text-slate-500 cursor-grab active:cursor-grabbing">
                      ⋮⋮
                    </span>

                    {/* 表示/非表示トグル */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(index);
                      }}
                      className={`text-sm ${obj.flags.visible ? "text-slate-300" : "text-slate-600"}`}
                      title={obj.flags.visible ? "非表示にする" : "表示する"}
                    >
                      {obj.flags.visible ? "👁" : "👁‍🗨"}
                    </button>

                    {/* オブジェクト名 */}
                    <span
                      className={`flex-1 text-xs truncate ${obj.flags.visible ? "text-slate-300" : "text-slate-500"}`}
                    >
                      {name}
                      {obj.text && ` "${obj.text}"`}
                    </span>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

      {/* レイヤー数表示 */}
      <div className="px-3 py-1 border-t border-slate-700 text-xs text-slate-500 flex-shrink-0 flex justify-between">
        <span>{objects.length} オブジェクト</span>
        {groups.length > 0 && <span>{groups.length} グループ</span>}
      </div>
    </div>
  );
}
