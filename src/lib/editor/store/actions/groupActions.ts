/**
 * グループ操作アクション
 */

import i18n from "@/lib/i18n";
import type { GridSettings, ObjectGroup } from "../../types";
import { generateGroupId, pushHistory } from "../../utils";
import type { EditorStore } from "../types";

/**
 * グループアクションを作成
 */
export function createGroupActions(store: EditorStore) {
	/**
	 * オブジェクトをグループ化
	 */
	const groupObjects = (objectIds: string[]) => {
		if (objectIds.length < 2) return;

		store.setState((state) => {
			const newGroup: ObjectGroup = {
				id: generateGroupId(),
				objectIds: [...objectIds],
			};

			const newGroups = [...state.groups, newGroup];

			return {
				...state,
				groups: newGroups,
				...pushHistory(
					{ ...state, groups: newGroups },
					i18n.t("history.groupObjects"),
				),
			};
		});
	};

	/**
	 * 選択オブジェクトをグループ化
	 */
	const groupSelected = () => {
		const state = store.state;
		if (state.selectedIds.length < 2) return;
		groupObjects(state.selectedIds);
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
				...pushHistory(
					{ ...state, groups: newGroups },
					i18n.t("history.ungroupObjects"),
				),
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
				...pushHistory(
					{ ...state, groups: newGroups },
					i18n.t("history.renameGroup"),
				),
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
	const removeFromGroup = (objectId: string) => {
		store.setState((state) => {
			// オブジェクトが属するグループを探す
			const group = state.groups.find((g) => g.objectIds.includes(objectId));
			if (!group) return state;

			// グループから除外
			const newIds = group.objectIds.filter((id) => id !== objectId);

			let newGroups: typeof state.groups;
			let newFocusedGroupId = state.focusedGroupId;

			if (newIds.length < 2) {
				// 残りが1つ以下ならグループ自体を削除
				newGroups = state.groups.filter((g) => g.id !== group.id);
				// フォーカス中のグループが削除された場合、フォーカスをクリア
				if (state.focusedGroupId === group.id) {
					newFocusedGroupId = null;
				}
			} else {
				// グループを更新
				newGroups = state.groups.map((g) =>
					g.id === group.id ? { ...g, objectIds: newIds } : g,
				);
			}

			return {
				...state,
				groups: newGroups,
				focusedGroupId: newFocusedGroupId,
				...pushHistory(
					{ ...state, groups: newGroups },
					i18n.t("history.removeFromGroup"),
				),
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
			isDirty: true,
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
			const focusedIdSet = new Set(focusedGroup?.objectIds ?? []);
			const newSelectedIds = focusedGroup
				? state.selectedIds.filter((id) => focusedIdSet.has(id))
				: state.selectedIds;

			// グループが折りたたまれていたら展開する
			const newGroups = state.groups.map((g) =>
				g.id === groupId ? { ...g, collapsed: false } : g,
			);

			return {
				...state,
				focusedGroupId: groupId,
				selectedIds: newSelectedIds,
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
	const getGroupForObject = (objectId: string): ObjectGroup | undefined => {
		return store.state.groups.find((g) => g.objectIds.includes(objectId));
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
