/**
 * プロパティパネルコンポーネント
 *
 * 選択状態に応じてボード設定またはオブジェクトプロパティを表示
 */

import { useCallback } from "react";
import { useEditor } from "@/lib/editor";
import { BatchPropertyPanel } from "./BatchPropertyPanel";
import { BoardPropertyPanel } from "./BoardPropertyPanel";
import { ObjectPropertyPanel } from "./ObjectPropertyPanel";

/**
 * プロパティパネル
 *
 * オブジェクト未選択時はボード設定を表示し、
 * 単一オブジェクト選択時はオブジェクトプロパティを表示し、
 * 複数オブジェクト選択時はバッチ編集パネルを表示
 */
export function PropertyPanel() {
	const {
		state,
		selectedObjects,
		updateObject,
		updateObjectsBatch,
		commitHistory,
		updateBoardMeta,
	} = useEditor();
	const { selectedIndices, board } = state;

	// 単一選択判定
	const selectedObject =
		selectedObjects.length === 1 ? selectedObjects[0] : null;
	const selectedIndex =
		selectedIndices.length === 1 ? selectedIndices[0] : null;

	// 複数選択判定
	const isMultipleSelection = selectedObjects.length > 1;

	// オブジェクト更新ハンドラ（単一選択用）
	const handleUpdateObject = useCallback(
		(updates: Parameters<typeof updateObject>[1]) => {
			if (selectedIndex !== null) {
				updateObject(selectedIndex, updates);
			}
		},
		[selectedIndex, updateObject],
	);

	// 複数選択時はバッチ編集パネルを表示
	if (isMultipleSelection) {
		return (
			<BatchPropertyPanel
				objects={selectedObjects}
				onUpdate={updateObjectsBatch}
				onCommitHistory={commitHistory}
			/>
		);
	}

	// 単一選択時はオブジェクトプロパティパネルを表示
	if (selectedObject && selectedIndex !== null) {
		return (
			<ObjectPropertyPanel
				object={selectedObject}
				onUpdate={handleUpdateObject}
				onCommitHistory={commitHistory}
			/>
		);
	}

	// 未選択時はボード情報を表示
	return (
		<BoardPropertyPanel
			board={board}
			onUpdateMeta={updateBoardMeta}
			onCommitHistory={commitHistory}
		/>
	);
}
