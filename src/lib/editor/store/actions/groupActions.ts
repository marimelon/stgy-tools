/**
 * Group operation actions
 */

import i18n from "@/lib/i18n";
import type { GridSettings, ObjectGroup } from "../../types";
import { generateGroupId, pushHistory } from "../../utils";
import type { EditorStore } from "../types";

export function createGroupActions(store: EditorStore) {
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

	const groupSelected = () => {
		const state = store.state;
		if (state.selectedIds.length < 2) return;
		groupObjects(state.selectedIds);
	};

	const ungroup = (groupId: string) => {
		store.setState((state) => {
			const newGroups = state.groups.filter((g) => g.id !== groupId);

			// Clear focus if the focused group was ungrouped
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

	const removeFromGroup = (objectId: string) => {
		store.setState((state) => {
			const group = state.groups.find((g) => g.objectIds.includes(objectId));
			if (!group) return state;

			const newIds = group.objectIds.filter((id) => id !== objectId);

			let newGroups: typeof state.groups;
			let newFocusedGroupId = state.focusedGroupId;

			if (newIds.length < 2) {
				// Delete group if less than 2 members remain
				newGroups = state.groups.filter((g) => g.id !== group.id);
				if (state.focusedGroupId === group.id) {
					newFocusedGroupId = null;
				}
			} else {
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

	const focusGroup = (groupId: string) => {
		store.setState((state) => {
			const groupExists = state.groups.some((g) => g.id === groupId);
			if (!groupExists) {
				return state;
			}

			// Deselect objects outside focused group
			const focusedGroup = state.groups.find((g) => g.id === groupId);
			const focusedIdSet = new Set(focusedGroup?.objectIds ?? []);
			const newSelectedIds = focusedGroup
				? state.selectedIds.filter((id) => focusedIdSet.has(id))
				: state.selectedIds;

			// Expand group if collapsed
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

	const unfocus = () => {
		store.setState((state) => ({
			...state,
			focusedGroupId: null,
		}));
	};

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
