/**
 * Object operation actions
 */

import { calculateLineEndpoint } from "@/lib/board";
import i18n from "@/lib/i18n";
import { type BoardObject, ObjectIds, type Position } from "@/lib/stgy";
import { duplicateObject } from "../../factory";
import type { BatchUpdatePayload } from "../../types";
import {
	cloneBoard,
	pushHistory,
	updateGroupsAfterDelete,
	updateObjectInBoard,
} from "../../utils";
import { canAddObject, canAddObjects } from "../../utils/validation";
import type { EditorStore } from "../types";

export function createObjectActions(store: EditorStore) {
	const updateObject = (objectId: string, updates: Partial<BoardObject>) => {
		store.setState((state) => {
			const newBoard = updateObjectInBoard(state.board, objectId, updates);
			return {
				...state,
				board: newBoard,
				isDirty: true,
			};
		});
	};

	const addObject = (object: BoardObject) => {
		store.setState((state) => {
			const validation = canAddObject(state.board, object.objectId);
			if (!validation.canAdd) {
				return {
					...state,
					lastError: {
						key: validation.errorKey ?? "editor.errors.unknown",
						params: validation.errorParams,
					},
				};
			}

			const newBoard = cloneBoard(state.board);
			newBoard.objects.unshift(object);
			return {
				...state,
				board: newBoard,
				groups: state.groups,
				selectedIds: [object.id],
				lastError: null,
				...pushHistory(
					{ ...state, board: newBoard, groups: state.groups },
					i18n.t("history.addObject"),
				),
			};
		});
	};

	const deleteObjects = (objectIds: string[]) => {
		if (objectIds.length === 0) return;

		store.setState((state) => {
			const idsToDelete = new Set(objectIds);
			const newBoard = cloneBoard(state.board);
			newBoard.objects = newBoard.objects.filter(
				(obj) => !idsToDelete.has(obj.id),
			);
			const updatedGroups = updateGroupsAfterDelete(state.groups, objectIds);
			return {
				...state,
				board: newBoard,
				groups: updatedGroups,
				selectedIds: [],
				...pushHistory(
					{ ...state, board: newBoard, groups: updatedGroups },
					i18n.t("history.deleteObject"),
				),
			};
		});
	};

	const deleteSelected = () => {
		const state = store.state;
		deleteObjects(state.selectedIds);
	};

	const duplicateObjects = (objectIds: string[]) => {
		if (objectIds.length === 0) return;

		store.setState((state) => {
			const objectsToDuplicate: BoardObject[] = [];
			for (const id of objectIds) {
				const obj = state.board.objects.find((o) => o.id === id);
				if (obj) {
					objectsToDuplicate.push(obj);
				}
			}

			const validation = canAddObjects(state.board, objectsToDuplicate);
			if (!validation.canAdd) {
				return {
					...state,
					lastError: {
						key: validation.errorKey ?? "editor.errors.unknown",
						params: validation.errorParams,
					},
				};
			}

			const newBoard = cloneBoard(state.board);
			const newIds: string[] = [];

			for (const original of objectsToDuplicate) {
				const duplicated = duplicateObject(original);
				newBoard.objects.push(duplicated);
				newIds.push(duplicated.id);
			}

			return {
				...state,
				board: newBoard,
				selectedIds: newIds,
				lastError: null,
				...pushHistory(
					{ ...state, board: newBoard },
					i18n.t("history.duplicateObject"),
				),
			};
		});
	};

	const duplicateSelected = () => {
		const state = store.state;
		duplicateObjects(state.selectedIds);
	};

	const moveObjects = (objectIds: string[], deltaX: number, deltaY: number) => {
		if (objectIds.length === 0) return;

		store.setState((state) => {
			let newBoard = state.board;
			for (const objectId of objectIds) {
				const obj = newBoard.objects.find((o) => o.id === objectId);
				if (!obj) continue;

				// Move endpoint (param1, param2) for Line objects
				if (obj.objectId === ObjectIds.Line) {
					const deltaX10 = Math.round(deltaX * 10);
					const deltaY10 = Math.round(deltaY * 10);
					newBoard = updateObjectInBoard(newBoard, objectId, {
						position: {
							x: obj.position.x + deltaX,
							y: obj.position.y + deltaY,
						},
						param1: (obj.param1 ?? obj.position.x * 10 + 2560) + deltaX10,
						param2: (obj.param2 ?? obj.position.y * 10) + deltaY10,
					});
				} else {
					newBoard = updateObjectInBoard(newBoard, objectId, {
						position: {
							x: obj.position.x + deltaX,
							y: obj.position.y + deltaY,
						},
					});
				}
			}

			return {
				...state,
				board: newBoard,
				isDirty: true,
			};
		});
	};

	/**
	 * Move objects with grid snap (batch optimized).
	 * Single state update for drag operation performance.
	 */
	const moveObjectsWithSnap = (
		startPositions: Map<string, Position>,
		deltaX: number,
		deltaY: number,
		gridSize: number,
	) => {
		store.setState((state) => {
			const newBoard = cloneBoard(state.board);

			for (const [objectId, startPos] of startPositions) {
				const index = newBoard.objects.findIndex((o) => o.id === objectId);
				if (index === -1) continue;

				const obj = newBoard.objects[index];
				if (obj.flags.locked) continue;

				const newX = Math.round((startPos.x + deltaX) / gridSize) * gridSize;
				const newY = Math.round((startPos.y + deltaY) / gridSize) * gridSize;

				// Move endpoint for Line objects
				if (obj.objectId === ObjectIds.Line) {
					const currentDeltaX = newX - obj.position.x;
					const currentDeltaY = newY - obj.position.y;
					const deltaX10 = Math.round(currentDeltaX * 10);
					const deltaY10 = Math.round(currentDeltaY * 10);
					newBoard.objects[index] = {
						...obj,
						position: { x: newX, y: newY },
						param1: (obj.param1 ?? obj.position.x * 10 + 2560) + deltaX10,
						param2: (obj.param2 ?? obj.position.y * 10) + deltaY10,
					};
				} else {
					newBoard.objects[index] = {
						...obj,
						position: { x: newX, y: newY },
					};
				}
			}

			return {
				...state,
				board: newBoard,
				isDirty: true,
			};
		});
	};

	const updateObjectsBatch = (
		objectIds: string[],
		updates: BatchUpdatePayload,
	) => {
		if (objectIds.length === 0 || Object.keys(updates).length === 0) return;

		store.setState((state) => {
			const newBoard = cloneBoard(state.board);

			for (const objectId of objectIds) {
				const index = newBoard.objects.findIndex((o) => o.id === objectId);
				if (index === -1) continue;

				const obj = newBoard.objects[index];

				// For Line rotation, rotate around midpoint
				if (obj.objectId === ObjectIds.Line && updates.rotation !== undefined) {
					const startX = obj.position.x;
					const startY = obj.position.y;
					const endpoint = calculateLineEndpoint(
						obj.position,
						obj.param1,
						obj.param2,
					);

					const centerX = (startX + endpoint.x) / 2;
					const centerY = (startY + endpoint.y) / 2;

					const dx = endpoint.x - startX;
					const dy = endpoint.y - startY;
					const halfLength = Math.sqrt(dx * dx + dy * dy) / 2;

					const radians = (updates.rotation * Math.PI) / 180;
					const offsetX = halfLength * Math.cos(radians);
					const offsetY = halfLength * Math.sin(radians);

					const newStartX = centerX - offsetX;
					const newStartY = centerY - offsetY;
					const newEndX = centerX + offsetX;
					const newEndY = centerY + offsetY;

					newBoard.objects[index] = {
						...obj,
						rotation: updates.rotation,
						position: { x: newStartX, y: newStartY },
						param1: Math.round(newEndX * 10),
						param2: Math.round(newEndY * 10),
						...(updates.size !== undefined && { size: updates.size }),
						...(updates.param3 !== undefined && { param3: updates.param3 }),
						flags: {
							...obj.flags,
							...(updates.flags ?? {}),
						},
						color: {
							...obj.color,
							...(updates.color ?? {}),
						},
					};
				} else {
					newBoard.objects[index] = {
						...obj,
						...(updates.rotation !== undefined && {
							rotation: updates.rotation,
						}),
						...(updates.size !== undefined && { size: updates.size }),
						...(updates.param1 !== undefined && { param1: updates.param1 }),
						...(updates.param2 !== undefined && { param2: updates.param2 }),
						...(updates.param3 !== undefined && { param3: updates.param3 }),
						flags: {
							...obj.flags,
							...(updates.flags ?? {}),
						},
						color: {
							...obj.color,
							...(updates.color ?? {}),
						},
					};
				}
			}

			return {
				...state,
				board: newBoard,
				isDirty: true,
			};
		});
	};

	return {
		updateObject,
		addObject,
		deleteObjects,
		deleteSelected,
		duplicateObjects,
		duplicateSelected,
		moveObjects,
		moveObjectsWithSnap,
		updateObjectsBatch,
	};
}

export type ObjectActions = ReturnType<typeof createObjectActions>;
