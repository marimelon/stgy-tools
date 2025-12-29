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
	const selectObject = (index: number, additive?: boolean) => {
		store.setState((state) => {
			if (additive) {
				// 追加選択モード (Shift + クリック)
				const exists = state.selectedIndices.includes(index);
				return {
					...state,
					selectedIndices: exists
						? state.selectedIndices.filter((i) => i !== index)
						: [...state.selectedIndices, index],
				};
			}
			// 単一選択
			return {
				...state,
				selectedIndices: [index],
			};
		});
	};

	/**
	 * 複数オブジェクトを選択
	 */
	const selectObjects = (indices: number[]) => {
		store.setState((state) => ({
			...state,
			selectedIndices: indices,
		}));
	};

	/**
	 * 全選択解除
	 */
	const deselectAll = () => {
		store.setState((state) => ({
			...state,
			selectedIndices: [],
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
						selectedIndices: focusedGroup.objectIndices,
					};
				}
			}
			// 通常モードは全選択
			return {
				...state,
				selectedIndices: state.board.objects.map((_, i) => i),
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
					selectedIndices: group.objectIndices,
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
