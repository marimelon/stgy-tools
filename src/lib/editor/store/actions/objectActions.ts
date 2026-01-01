/**
 * オブジェクト操作アクション
 */

import i18n from "@/lib/i18n";
import { type BoardObject, ObjectIds, type Position } from "@/lib/stgy";
import { duplicateObject } from "../../factory";
import {
	canAddObject,
	canAddObjects,
} from "../../reducerHandlers/businessLogic/validation";
import {
	cloneBoard,
	pushHistory,
	shiftGroupIndices,
	updateGroupsAfterDelete,
	updateObjectInBoard,
} from "../../reducerHandlers/utils";
import type { BatchUpdatePayload } from "../../types";
import type { EditorStore } from "../types";

/**
 * オブジェクトアクションを作成
 */
export function createObjectActions(store: EditorStore) {
	/**
	 * オブジェクトを更新
	 */
	const updateObject = (index: number, updates: Partial<BoardObject>) => {
		store.setState((state) => {
			const newBoard = updateObjectInBoard(state.board, index, updates);
			return {
				...state,
				board: newBoard,
				isDirty: true,
			};
		});
	};

	/**
	 * オブジェクトを追加
	 */
	const addObject = (object: BoardObject) => {
		store.setState((state) => {
			// バリデーション
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
			// グループのインデックスを更新（先頭に追加するので全て+1）
			const updatedGroups = shiftGroupIndices(state.groups, 1);
			return {
				...state,
				board: newBoard,
				groups: updatedGroups,
				selectedIndices: [0],
				lastError: null,
				...pushHistory(
					{ ...state, groups: updatedGroups },
					i18n.t("history.addObject"),
				),
			};
		});
	};

	/**
	 * オブジェクトを削除
	 */
	const deleteObjects = (indices: number[]) => {
		if (indices.length === 0) return;

		store.setState((state) => {
			const newBoard = cloneBoard(state.board);
			// インデックスを降順でソートして削除 (インデックスのずれを防ぐ)
			const sortedIndices = [...indices].sort((a, b) => b - a);
			for (const index of sortedIndices) {
				if (index >= 0 && index < newBoard.objects.length) {
					newBoard.objects.splice(index, 1);
				}
			}
			// グループを更新
			const updatedGroups = updateGroupsAfterDelete(state.groups, indices);
			return {
				...state,
				board: newBoard,
				groups: updatedGroups,
				selectedIndices: [],
				...pushHistory(
					{ ...state, groups: updatedGroups },
					i18n.t("history.deleteObject"),
				),
			};
		});
	};

	/**
	 * 選択オブジェクトを削除
	 */
	const deleteSelected = () => {
		const state = store.state;
		deleteObjects(state.selectedIndices);
	};

	/**
	 * オブジェクトを複製
	 */
	const duplicateObjects = (indices: number[]) => {
		if (indices.length === 0) return;

		store.setState((state) => {
			// 複製対象のオブジェクトを収集
			const objectsToDuplicate: BoardObject[] = [];
			for (const index of indices) {
				if (index >= 0 && index < state.board.objects.length) {
					objectsToDuplicate.push(state.board.objects[index]);
				}
			}

			// バリデーション
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
			const newIndices: number[] = [];

			for (const index of indices) {
				if (index >= 0 && index < state.board.objects.length) {
					const original = state.board.objects[index];
					const duplicated = duplicateObject(original);
					newBoard.objects.push(duplicated);
					newIndices.push(newBoard.objects.length - 1);
				}
			}

			return {
				...state,
				board: newBoard,
				selectedIndices: newIndices,
				lastError: null,
				...pushHistory(state, i18n.t("history.duplicateObject")),
			};
		});
	};

	/**
	 * 選択オブジェクトを複製
	 */
	const duplicateSelected = () => {
		const state = store.state;
		duplicateObjects(state.selectedIndices);
	};

	/**
	 * オブジェクトを移動
	 */
	const moveObjects = (indices: number[], deltaX: number, deltaY: number) => {
		if (indices.length === 0) return;

		store.setState((state) => {
			let newBoard = state.board;
			for (const index of indices) {
				if (index >= 0 && index < newBoard.objects.length) {
					const obj = newBoard.objects[index];

					// Lineオブジェクトの場合は終点座標（param1, param2）も移動
					if (obj.objectId === ObjectIds.Line) {
						const deltaX10 = Math.round(deltaX * 10);
						const deltaY10 = Math.round(deltaY * 10);
						newBoard = updateObjectInBoard(newBoard, index, {
							position: {
								x: obj.position.x + deltaX,
								y: obj.position.y + deltaY,
							},
							param1: (obj.param1 ?? obj.position.x * 10 + 2560) + deltaX10,
							param2: (obj.param2 ?? obj.position.y * 10) + deltaY10,
						});
					} else {
						newBoard = updateObjectInBoard(newBoard, index, {
							position: {
								x: obj.position.x + deltaX,
								y: obj.position.y + deltaY,
							},
						});
					}
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
	 * オブジェクトをグリッドスナップ付きで移動（バッチ最適化版）
	 * ドラッグ操作時のパフォーマンス最適化のため単一のstate更新で処理
	 */
	const moveObjectsWithSnap = (
		startPositions: Map<number, Position>,
		deltaX: number,
		deltaY: number,
		gridSize: number,
	) => {
		store.setState((state) => {
			const newBoard = cloneBoard(state.board);

			for (const [idx, startPos] of startPositions) {
				if (idx >= 0 && idx < newBoard.objects.length) {
					const obj = newBoard.objects[idx];
					if (obj.flags.locked) continue;

					const newX = Math.round((startPos.x + deltaX) / gridSize) * gridSize;
					const newY = Math.round((startPos.y + deltaY) / gridSize) * gridSize;

					// Lineオブジェクトの場合は終点座標も移動
					if (obj.objectId === ObjectIds.Line) {
						const currentDeltaX = newX - obj.position.x;
						const currentDeltaY = newY - obj.position.y;
						const deltaX10 = Math.round(currentDeltaX * 10);
						const deltaY10 = Math.round(currentDeltaY * 10);
						newBoard.objects[idx] = {
							...obj,
							position: { x: newX, y: newY },
							param1: (obj.param1 ?? obj.position.x * 10 + 2560) + deltaX10,
							param2: (obj.param2 ?? obj.position.y * 10) + deltaY10,
						};
					} else {
						newBoard.objects[idx] = {
							...obj,
							position: { x: newX, y: newY },
						};
					}
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
	 * 複数オブジェクトを一括更新
	 */
	const updateObjectsBatch = (
		indices: number[],
		updates: BatchUpdatePayload,
	) => {
		if (indices.length === 0 || Object.keys(updates).length === 0) return;

		store.setState((state) => {
			// 単一クローンで効率的にバッチ更新
			const newBoard = cloneBoard(state.board);

			for (const index of indices) {
				if (index < 0 || index >= newBoard.objects.length) continue;

				const obj = newBoard.objects[index];

				// 更新を適用（ネストされたオブジェクトは適切にマージ）
				newBoard.objects[index] = {
					...obj,
					...(updates.rotation !== undefined && { rotation: updates.rotation }),
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
