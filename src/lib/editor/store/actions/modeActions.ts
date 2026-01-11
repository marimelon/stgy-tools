/**
 * Mode-related actions (circular arrangement, text editing, errors)
 */

import i18n from "@/lib/i18n";
import { ObjectIds, type Position } from "@/lib/stgy";
import type { EditorError } from "../../types";
import { cloneBoard, updateObjectInBoard } from "../../utils";
import type { EditorStore } from "../types";

const MIN_RADIUS = 10;

export function createModeActions(store: EditorStore) {
	// ============================================
	// Circular arrangement mode
	// ============================================

	const enterCircularMode = (
		center: Position,
		radius: number,
		objectIds: string[],
	) => {
		store.setState((state) => {
			const objectAngles = new Map<string, number>();
			for (const id of objectIds) {
				const obj = state.board.objects.find((o) => o.id === id);
				if (obj) {
					const angle = Math.atan2(
						obj.position.y - center.y,
						obj.position.x - center.x,
					);
					objectAngles.set(id, angle);
				}
			}

			return {
				...state,
				circularMode: {
					center,
					radius: Math.max(radius, MIN_RADIUS),
					participatingIds: objectIds,
					objectAngles,
				},
			};
		});
	};

	const exitCircularMode = () => {
		store.setState((state) => ({
			...state,
			circularMode: null,
		}));
	};

	/**
	 * Update circle center (moves all objects)
	 */
	const updateCircularCenter = (center: Position) => {
		store.setState((state) => {
			if (!state.circularMode) return state;

			const oldCenter = state.circularMode.center;
			const deltaX = center.x - oldCenter.x;
			const deltaY = center.y - oldCenter.y;

			let newBoard = cloneBoard(state.board);

			for (const id of state.circularMode.participatingIds) {
				const obj = newBoard.objects.find((o) => o.id === id);
				if (obj) {
					newBoard = updateObjectInBoard(newBoard, id, {
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
				circularMode: {
					...state.circularMode,
					center,
				},
			};
		});
	};

	/**
	 * Update circle radius (repositions all objects at new radius)
	 */
	const updateCircularRadius = (radius: number) => {
		store.setState((state) => {
			if (!state.circularMode) return state;

			const newRadius = Math.max(radius, MIN_RADIUS);
			const { center, objectAngles } = state.circularMode;

			let newBoard = cloneBoard(state.board);

			// Reposition each object at new radius (preserve angle)
			for (const [id, angle] of objectAngles) {
				newBoard = updateObjectInBoard(newBoard, id, {
					position: {
						x: center.x + newRadius * Math.cos(angle),
						y: center.y + newRadius * Math.sin(angle),
					},
				});
			}

			return {
				...state,
				board: newBoard,
				circularMode: {
					...state.circularMode,
					radius: newRadius,
				},
			};
		});
	};

	const moveObjectOnCircle = (objectId: string, angle: number) => {
		store.setState((state) => {
			if (!state.circularMode) return state;

			const { center, radius, participatingIds, objectAngles } =
				state.circularMode;

			if (!participatingIds.includes(objectId)) return state;

			let newBoard = cloneBoard(state.board);
			newBoard = updateObjectInBoard(newBoard, objectId, {
				position: {
					x: center.x + radius * Math.cos(angle),
					y: center.y + radius * Math.sin(angle),
				},
			});

			const newObjectAngles = new Map(objectAngles);
			newObjectAngles.set(objectId, angle);

			return {
				...state,
				board: newBoard,
				circularMode: {
					...state.circularMode,
					objectAngles: newObjectAngles,
				},
			};
		});
	};

	// ============================================
	// Text editing mode
	// ============================================

	const startTextEdit = (objectId: string) => {
		store.setState((state) => {
			const obj = state.board.objects.find((o) => o.id === objectId);

			// Only text objects can be edited
			if (!obj || obj.objectId !== ObjectIds.Text) {
				return state;
			}

			if (obj.flags.locked) {
				return state;
			}

			return {
				...state,
				editingTextId: objectId,
				selectedIds: [objectId],
			};
		});
	};

	const endTextEdit = (save: boolean, text?: string) => {
		store.setState((state) => {
			if (state.editingTextId === null) {
				return state;
			}

			const editingId = state.editingTextId;
			const editingIndex = state.board.objects.findIndex(
				(o) => o.id === editingId,
			);
			const currentText = state.board.objects[editingIndex]?.text;

			let newState = { ...state, editingTextId: null };

			// Update only if text actually changed
			if (
				save &&
				text !== undefined &&
				text !== currentText &&
				editingIndex !== -1
			) {
				// Revert to default text if empty
				const finalText =
					text.trim() === "" ? i18n.t("common.defaultText") : text;
				const newObjects = [...state.board.objects];
				newObjects[editingIndex] = {
					...newObjects[editingIndex],
					text: finalText,
				};
				newState = {
					...newState,
					board: { ...state.board, objects: newObjects },
				};
			}

			return newState;
		});
	};

	// ============================================
	// Error management
	// ============================================

	const setError = (error: EditorError) => {
		store.setState((state) => ({
			...state,
			lastError: error,
		}));
	};

	const clearError = () => {
		store.setState((state) => ({
			...state,
			lastError: null,
		}));
	};

	return {
		// Circular arrangement mode
		enterCircularMode,
		exitCircularMode,
		updateCircularCenter,
		updateCircularRadius,
		moveObjectOnCircle,
		// Text editing
		startTextEdit,
		endTextEdit,
		// Error management
		setError,
		clearError,
	};
}

export type ModeActions = ReturnType<typeof createModeActions>;
