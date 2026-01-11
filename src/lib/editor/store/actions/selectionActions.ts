/**
 * Selection-related actions
 */

import type { EditorStore } from "../types";

export function createSelectionActions(store: EditorStore) {
	const selectObject = (objectId: string, additive?: boolean) => {
		store.setState((state) => {
			if (additive) {
				// Additive selection (Shift + click)
				const exists = state.selectedIds.includes(objectId);
				return {
					...state,
					selectedIds: exists
						? state.selectedIds.filter((id) => id !== objectId)
						: [...state.selectedIds, objectId],
				};
			}
			return {
				...state,
				selectedIds: [objectId],
			};
		});
	};

	const selectObjects = (objectIds: string[]) => {
		store.setState((state) => ({
			...state,
			selectedIds: objectIds,
		}));
	};

	const deselectAll = () => {
		store.setState((state) => ({
			...state,
			selectedIds: [],
		}));
	};

	const selectAll = () => {
		store.setState((state) => {
			// In focus mode, only select objects within focused group
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
			return {
				...state,
				selectedIds: state.board.objects.map((obj) => obj.id),
			};
		});
	};

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
