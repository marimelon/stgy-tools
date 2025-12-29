/**
 * グループ操作アクション
 */

import { generateGroupId, pushHistory } from "../../reducerHandlers/utils";
import type { GridSettings, ObjectGroup } from "../../types";
import type { EditorStore } from "../types";

/**
 * グループアクションを作成
 */
export function createGroupActions(store: EditorStore) {
	/**
	 * オブジェクトをグループ化
	 */
	const groupObjects = (indices: number[]) => {
		if (indices.length < 2) return;

		store.setState((state) => {
			const newGroup: ObjectGroup = {
				id: generateGroupId(),
				objectIndices: [...indices].sort((a, b) => a - b),
			};

			const newGroups = [...state.groups, newGroup];

			return {
				...state,
				groups: newGroups,
				...pushHistory({ ...state, groups: newGroups }, "グループ化"),
			};
		});
	};

	/**
	 * 選択オブジェクトをグループ化
	 */
	const groupSelected = () => {
		const state = store.state;
		if (state.selectedIndices.length < 2) return;
		groupObjects(state.selectedIndices);
	};

	/**
	 * グループを解除
	 */
	const ungroup = (groupId: string) => {
		store.setState((state) => {
			const newGroups = state.groups.filter((g) => g.id !== groupId);

			// フォーカス中のグループが解除された場合、フォーカスをクリア
			const newFocusedGroupId =
				state.focusedGroupId === groupId ? null : state.focusedGroupId;

			return {
				...state,
				groups: newGroups,
				focusedGroupId: newFocusedGroupId,
				...pushHistory({ ...state, groups: newGroups }, "グループ解除"),
			};
		});
	};

	/**
	 * グループ名を変更
	 */
	const renameGroup = (groupId: string, name: string) => {
		store.setState((state) => {
			const normalizedName = name.trim();

			const newGroups = state.groups.map((g) =>
				g.id === groupId ? { ...g, name: normalizedName || undefined } : g,
			);

			return {
				...state,
				groups: newGroups,
				...pushHistory({ ...state, groups: newGroups }, "グループ名変更"),
			};
		});
	};

	/**
	 * グループの折りたたみ状態を切り替え
	 */
	const toggleGroupCollapse = (groupId: string) => {
		store.setState((state) => {
			const newGroups = state.groups.map((g) =>
				g.id === groupId ? { ...g, collapsed: !g.collapsed } : g,
			);

			return {
				...state,
				groups: newGroups,
			};
		});
	};

	/**
	 * オブジェクトをグループから除外
	 */
	const removeFromGroup = (objectIndex: number) => {
		store.setState((state) => {
			// オブジェクトが属するグループを探す
			const group = state.groups.find((g) =>
				g.objectIndices.includes(objectIndex),
			);
			if (!group) return state;

			// グループから除外
			const newIndices = group.objectIndices.filter((i) => i !== objectIndex);

			let newGroups: typeof state.groups;
			let newFocusedGroupId = state.focusedGroupId;

			if (newIndices.length < 2) {
				// 残りが1つ以下ならグループ自体を削除
				newGroups = state.groups.filter((g) => g.id !== group.id);
				// フォーカス中のグループが削除された場合、フォーカスをクリア
				if (state.focusedGroupId === group.id) {
					newFocusedGroupId = null;
				}
			} else {
				// グループを更新
				newGroups = state.groups.map((g) =>
					g.id === group.id ? { ...g, objectIndices: newIndices } : g,
				);
			}

			return {
				...state,
				groups: newGroups,
				focusedGroupId: newFocusedGroupId,
				...pushHistory({ ...state, groups: newGroups }, "グループから除外"),
			};
		});
	};

	/**
	 * グリッド設定を更新
	 */
	const setGridSettings = (settings: Partial<GridSettings>) => {
		store.setState((state) => ({
			...state,
			gridSettings: {
				...state.gridSettings,
				...settings,
			},
		}));
	};

	/**
	 * フォーカスグループを設定
	 */
	const focusGroup = (groupId: string) => {
		store.setState((state) => {
			// グループが存在するか検証
			const groupExists = state.groups.some((g) => g.id === groupId);
			if (!groupExists) {
				return state;
			}

			// フォーカス設定時、フォーカス外のオブジェクトが選択されていたら選択解除
			const focusedGroup = state.groups.find((g) => g.id === groupId);
			const newSelectedIndices = focusedGroup
				? state.selectedIndices.filter((idx) =>
						focusedGroup.objectIndices.includes(idx),
					)
				: state.selectedIndices;

			// グループが折りたたまれていたら展開する
			const newGroups = state.groups.map((g) =>
				g.id === groupId ? { ...g, collapsed: false } : g,
			);

			return {
				...state,
				focusedGroupId: groupId,
				selectedIndices: newSelectedIndices,
				groups: newGroups,
			};
		});
	};

	/**
	 * フォーカスを解除
	 */
	const unfocus = () => {
		store.setState((state) => ({
			...state,
			focusedGroupId: null,
		}));
	};

	/**
	 * オブジェクトが属するグループを取得
	 */
	const getGroupForObject = (index: number): ObjectGroup | undefined => {
		return store.state.groups.find((g) => g.objectIndices.includes(index));
	};

	return {
		groupObjects,
		groupSelected,
		ungroup,
		renameGroup,
		toggleGroupCollapse,
		removeFromGroup,
		setGridSettings,
		focusGroup,
		unfocus,
		getGroupForObject,
	};
}

export type GroupActions = ReturnType<typeof createGroupActions>;
