/**
 * Layer operation actions
 */

import i18n from "@/lib/i18n";
import { cloneBoard, pushHistory } from "../../utils";
import type { EditorStore } from "../types";

export type LayerDirection = "front" | "back" | "forward" | "backward";

export function createLayerActions(store: EditorStore) {
	const moveLayer = (objectId: string, direction: LayerDirection) => {
		store.setState((state) => {
			const objects = state.board.objects;
			const index = objects.findIndex((obj) => obj.id === objectId);

			if (index < 0 || index >= objects.length) return state;

			const newBoard = cloneBoard(state.board);
			const [movedObject] = newBoard.objects.splice(index, 1);

			let newIndex: number;
			switch (direction) {
				case "front":
					newIndex = 0;
					break;
				case "back":
					newIndex = newBoard.objects.length;
					break;
				case "forward":
					newIndex = Math.max(0, index - 1);
					break;
				case "backward":
					newIndex = Math.min(newBoard.objects.length, index + 1);
					break;
			}

			newBoard.objects.splice(newIndex, 0, movedObject);

			const descriptions: Record<LayerDirection, string> = {
				front: i18n.t("history.bringToFront"),
				back: i18n.t("history.sendToBack"),
				forward: i18n.t("history.bringForward"),
				backward: i18n.t("history.sendBackward"),
			};

			return {
				...state,
				board: newBoard,
				selectedIds: [objectId],
				...pushHistory({ ...state, board: newBoard }, descriptions[direction]),
			};
		});
	};

	const moveSelectedLayer = (direction: LayerDirection) => {
		const state = store.state;
		if (state.selectedIds.length !== 1) return;
		moveLayer(state.selectedIds[0], direction);
	};

	/**
	 * Reorder layer to arbitrary position (for drag & drop)
	 */
	const reorderLayer = (objectId: string, toIndex: number) => {
		store.setState((state) => {
			const objects = state.board.objects;
			const fromIndex = objects.findIndex((obj) => obj.id === objectId);

			if (fromIndex < 0 || fromIndex >= objects.length) return state;
			if (toIndex < 0 || toIndex > objects.length) return state;
			if (fromIndex === toIndex || fromIndex === toIndex - 1) return state;

			const newBoard = cloneBoard(state.board);
			const [movedObject] = newBoard.objects.splice(fromIndex, 1);

			// Adjust index when inserting after fromIndex (due to splice)
			const adjustedToIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
			newBoard.objects.splice(adjustedToIndex, 0, movedObject);

			return {
				...state,
				board: newBoard,
				selectedIds: [objectId],
				...pushHistory(
					{ ...state, board: newBoard },
					i18n.t("history.reorderLayers"),
				),
			};
		});
	};

	/**
	 * Reorder entire group to arbitrary position
	 */
	const reorderGroup = (groupId: string, toIndex: number) => {
		store.setState((state) => {
			const group = state.groups.find((g) => g.id === groupId);
			if (!group) return state;

			const newBoard = cloneBoard(state.board);

			// Get current indices of group objects (sorted by array order)
			const groupIndices = group.objectIds
				.map((id) => newBoard.objects.findIndex((obj) => obj.id === id))
				.filter((idx) => idx !== -1)
				.sort((a, b) => a - b);

			if (groupIndices.length === 0) return state;

			const groupSize = groupIndices.length;
			const firstIndex = groupIndices[0];

			if (toIndex === firstIndex || toIndex === firstIndex + groupSize) {
				return state;
			}

			const groupObjects = groupIndices.map((i) => newBoard.objects[i]);

			// Remove from back to front to preserve indices
			for (let i = groupIndices.length - 1; i >= 0; i--) {
				newBoard.objects.splice(groupIndices[i], 1);
			}

			// Adjust insertion index (may shift due to removal)
			let insertAt = toIndex;
			if (toIndex > firstIndex) {
				insertAt = toIndex - groupSize;
			}

			newBoard.objects.splice(insertAt, 0, ...groupObjects);

			const newSelectedIds = groupObjects.map((obj) => obj.id);

			return {
				...state,
				board: newBoard,
				selectedIds: newSelectedIds,
				...pushHistory(
					{ ...state, board: newBoard },
					i18n.t("history.groupMove"),
				),
			};
		});
	};

	return {
		moveLayer,
		moveSelectedLayer,
		reorderLayer,
		reorderGroup,
	};
}

export type LayerActions = ReturnType<typeof createLayerActions>;
