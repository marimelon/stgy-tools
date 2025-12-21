/**
 * レイヤーパネルコンポーネント
 *
 * オブジェクトのレイヤー順を表示・編集（グループ対応）
 * ドラッグ&ドロップでレイヤー順序を変更可能
 */

import { useCallback, useMemo, useState, type DragEvent } from "react";
import { useEditor } from "@/lib/editor";
import { ObjectNames } from "@/lib/stgy";
import type { ObjectGroup } from "@/lib/editor/types";
import { GripVertical, Eye, EyeOff, ChevronRight, ChevronDown, X } from "lucide-react";

/** ドロップターゲット情報 */
interface DropTarget {
  /** ドロップ先のobjects配列インデックス */
  index: number;
  /** 挿入位置（前か後か） */
  position: "before" | "after";
}

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
    reorderLayer,
    reorderGroup,
    removeFromGroup,
  } = useEditor();
  const { board, selectedIndices, groups } = state;
  const { objects } = board;

  // ドラッグ状態
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedFromGroup, setDraggedFromGroup] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

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

  // オブジェクトのドラッグ開始
  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, index: number) => {
      const group = getGroupForObject(index);

      setDraggedIndex(index);
      setDraggedFromGroup(group?.id ?? null);
      setDraggedGroupId(null);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    },
    [getGroupForObject]
  );

  // グループヘッダーのドラッグ開始
  const handleGroupDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, groupId: string) => {
      setDraggedIndex(null);
      setDraggedFromGroup(null);
      setDraggedGroupId(groupId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", groupId);
    },
    []
  );

  // ドラッグオーバー（ドロップ位置の計算）
  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, targetIndex: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      // グループをドラッグ中の場合
      if (draggedGroupId) {
        // 自分のグループ内オブジェクトの上はスキップ
        const draggingGroup = groups.find((g) => g.id === draggedGroupId);
        if (draggingGroup?.objectIndices.includes(targetIndex)) {
          setDropTarget(null);
          return;
        }

        // 他のグループの判定
        const targetGroup = getGroupForObject(targetIndex);
        if (targetGroup) {
          // 他のグループのヘッダー上（firstIndex）ならドロップ許可
          const firstInTargetGroup = Math.min(...targetGroup.objectIndices);
          if (targetIndex !== firstInTargetGroup) {
            // グループ内の非先頭要素上→不可
            setDropTarget(null);
            return;
          }
          // 先頭要素上（グループヘッダー上）→許可して続行
        }

        // 上半分か下半分かを判定
        const rect = e.currentTarget.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const position = e.clientY < midY ? "before" : "after";

        setDropTarget({ index: targetIndex, position });
        return;
      }

      // オブジェクトをドラッグ中の場合
      // 同じグループ内でのドラッグの場合のみ許可
      // または、グループ外へのドラッグ（グループから除外）
      const targetGroup = getGroupForObject(targetIndex);

      // ターゲットがグループ内で、ドラッグ元と異なるグループの場合は不可
      if (targetGroup && targetGroup.id !== draggedFromGroup) {
        setDropTarget(null);
        return;
      }

      // 自分自身の上はスキップ
      if (draggedIndex === targetIndex) {
        setDropTarget(null);
        return;
      }

      // 上半分か下半分かを判定
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? "before" : "after";

      // 実際に移動が発生しない位置（隣接位置）はスキップ
      const potentialToIndex = position === "before" ? targetIndex : targetIndex + 1;
      if (draggedIndex === potentialToIndex || draggedIndex === potentialToIndex - 1) {
        setDropTarget(null);
        return;
      }

      setDropTarget({ index: targetIndex, position });
    },
    [draggedIndex, draggedFromGroup, draggedGroupId, groups, getGroupForObject]
  );

  // ドラッグ状態をリセット
  const resetDragState = useCallback(() => {
    setDraggedIndex(null);
    setDraggedFromGroup(null);
    setDraggedGroupId(null);
    setDropTarget(null);
  }, []);

  // ドラッグ終了（リセット）
  const handleDragEnd = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  // ドロップ処理
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();

      if (dropTarget === null) return;

      // toIndex を計算
      // position が "before" なら targetIndex、"after" なら targetIndex + 1
      const toIndex =
        dropTarget.position === "before"
          ? dropTarget.index
          : dropTarget.index + 1;

      // グループをドロップした場合
      if (draggedGroupId) {
        reorderGroup(draggedGroupId, toIndex);
        resetDragState();
        return;
      }

      // オブジェクトをドロップした場合
      if (draggedIndex === null) return;

      // ドロップ先のグループを確認
      const targetGroup = getGroupForObject(dropTarget.index);

      // グループ外へドロップした場合、グループから除外
      if (draggedFromGroup && !targetGroup) {
        removeFromGroup(draggedIndex);
      }

      reorderLayer(draggedIndex, toIndex);
      resetDragState();
    },
    [draggedIndex, draggedFromGroup, draggedGroupId, dropTarget, getGroupForObject, removeFromGroup, reorderLayer, reorderGroup, resetDragState]
  );

  // ドラッグリーブ時のリセット
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    // リスト外に出た場合のみリセット
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTarget(null);
    }
  }, []);

  return (
    <div className="bg-slate-800 flex flex-col h-full">
      <div className="p-2 border-b border-slate-700 flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-200">レイヤー</h2>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        onDragLeave={handleDragLeave}
      >
        {objects.length === 0 ? (
          <div className="p-3 text-sm text-slate-500 text-center">
            オブジェクトがありません
          </div>
        ) : (
          <div className="py-1">
            {layerItems.map((item) => {
              if (item.type === "group-header" && item.group) {
                const group = item.group;
                const allSelected = group.objectIndices.every((i) =>
                  selectedIndices.includes(i)
                );
                const isDraggingGroup = draggedGroupId === group.id;
                const firstIndex = Math.min(...group.objectIndices);
                const isDropBeforeGroup =
                  dropTarget?.index === firstIndex && dropTarget?.position === "before";

                return (
                  <div key={`group-${group.id}`} className="relative">
                    {/* ドロップインジケーター（グループの前） */}
                    {isDropBeforeGroup && (
                      <div className="absolute top-0 left-1 right-1 h-0.5 bg-cyan-500 rounded z-10" />
                    )}

                    <div
                      draggable
                      onDragStart={(e) => handleGroupDragStart(e, group.id)}
                      onDragOver={(e) => handleDragOver(e, firstIndex)}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                      onClick={(e) => handleSelectGroup(group.id, e)}
                      className={`
                        flex items-center gap-2 px-2 py-1 mx-1 rounded cursor-pointer
                        transition-colors select-none
                        ${isDraggingGroup ? "opacity-50" : ""}
                        ${allSelected ? "bg-purple-600/30 border border-purple-500/50" : "hover:bg-slate-700 border border-transparent"}
                      `}
                    >
                      {/* ドラッグハンドル */}
                      <span className="text-slate-500 cursor-grab active:cursor-grabbing">
                        <GripVertical size={14} />
                      </span>

                      {/* 折りたたみトグル */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleCollapse(group.id, e)}
                        className="text-slate-400 hover:text-slate-200 w-4"
                      >
                        {group.collapsed ? (
                          <ChevronRight size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>

                      {/* グループアイコン */}
                      <span className="text-purple-400 text-xs">⊞</span>

                      {/* グループ名 */}
                      <span className="flex-1 text-xs text-purple-300 truncate">
                        グループ ({group.objectIndices.length})
                      </span>

                      {/* グループ解除ボタン */}
                      <button
                        type="button"
                        onClick={(e) => handleUngroupClick(group.id, e)}
                        className="text-slate-500 hover:text-slate-300"
                        title="グループ解除"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              }

              if (item.type === "object" && item.index !== undefined) {
                const index = item.index;
                const obj = objects[index];
                const isSelected = selectedIndices.includes(index);
                const name = ObjectNames[obj.objectId] ?? `ID: ${obj.objectId}`;
                const isDragging = draggedIndex === index;
                // グループドラッグ中でグループ内アイテムの場合はグループヘッダーに任せる
                const isDropBefore =
                  dropTarget?.index === index && dropTarget?.position === "before" &&
                  !(draggedGroupId && item.isInGroup);
                const isDropAfter =
                  dropTarget?.index === index && dropTarget?.position === "after" &&
                  !(draggedGroupId && item.isInGroup);

                return (
                  <div key={`obj-${index}`} className="relative">
                    {/* ドロップインジケーター（前） */}
                    {isDropBefore && (
                      <div className="absolute top-0 left-1 right-1 h-0.5 bg-cyan-500 rounded z-10" />
                    )}

                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                      onClick={(e) => handleSelectObject(index, e)}
                      className={`
                        flex items-center gap-2 px-2 py-1 mx-1 rounded cursor-pointer
                        transition-colors select-none
                        ${item.isInGroup ? "ml-4" : ""}
                        ${isDragging ? "opacity-50" : ""}
                        ${isSelected ? "bg-cyan-600/30 border border-cyan-500/50" : "hover:bg-slate-700 border border-transparent"}
                      `}
                    >
                      {/* ドラッグハンドル */}
                      <span className="text-slate-500 cursor-grab active:cursor-grabbing">
                        <GripVertical size={14} />
                      </span>

                      {/* 表示/非表示トグル */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(index);
                        }}
                        className={`${obj.flags.visible ? "text-slate-300" : "text-slate-600"}`}
                        title={obj.flags.visible ? "非表示にする" : "表示する"}
                      >
                        {obj.flags.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      {/* オブジェクト名 */}
                      <span
                        className={`flex-1 text-xs truncate ${obj.flags.visible ? "text-slate-300" : "text-slate-500"}`}
                      >
                        {name}
                        {obj.text && ` "${obj.text}"`}
                      </span>
                    </div>

                    {/* ドロップインジケーター（後） */}
                    {isDropAfter && (
                      <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-cyan-500 rounded z-10" />
                    )}
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
