/**
 * 選択関連アクション
 */

import type { EditorStore } from "../types";

/**
 * 選択アクションを作成
 */
export function createSelectionActions(store: EditorStore) {
	/**
	 * オブジェクトを選択
	 */
	const selectObject = (objectId: string, additive?: boolean) => {
		store.setState((state) => {
			if (additive) {
				// 追加選択モード (Shift + クリック)
				const exists = state.selectedIds.includes(objectId);
				return {
					...state,
					selectedIds: exists
						? state.selectedIds.filter((id) => id !== objectId)
						: [...state.selectedIds, objectId],
				};
			}
			// 単一選択
			return {
				...state,
				selectedIds: [objectId],
			};
		});
	};

	/**
	 * 複数オブジェクトを選択
	 */
	const selectObjects = (objectIds: string[]) => {
		store.setState((state) => ({
			...state,
			selectedIds: objectIds,
		}));
	};

	/**
	 * 全選択解除
	 */
	const deselectAll = () => {
		store.setState((state) => ({
			...state,
			selectedIds: [],
		}));
	};

	/**
	 * 全オブジェクトを選択
	 */
	const selectAll = () => {
		store.setState((state) => {
			// フォーカスモード中はフォーカス中グループ内のみを選択
			if (state.focusedGroupId !== null) {
				const focusedGroup = state.groups.find(
					(g) => g.id === state.focusedGroupId,
				);
				if (focusedGroup) {
					return {
						...state,
						selectedIds: focusedGroup.objectIds,
					};
				}
			}
			// 通常モードは全選択
			return {
				...state,
				selectedIds: state.board.objects.map((obj) => obj.id),
			};
		});
	};

	/**
	 * グループ内の全オブジェクトを選択
	 */
	const selectGroup = (groupId: string) => {
		store.setState((state) => {
			const group = state.groups.find((g) => g.id === groupId);
			if (group) {
				return {
					...state,
					selectedIds: group.objectIds,
				};
			}
			return state;
		});
	};

	return {
		selectObject,
		selectObjects,
		deselectAll,
		selectAll,
		selectGroup,
	};
}

export type SelectionActions = ReturnType<typeof createSelectionActions>;
