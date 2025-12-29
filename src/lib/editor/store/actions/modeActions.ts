/**
 * モード関連アクション（円形配置、テキスト編集、エラー）
 */

import i18n from "@/lib/i18n";
import { ObjectIds, type Position } from "@/lib/stgy";
import { cloneBoard, updateObjectInBoard } from "../../reducerHandlers/utils";
import type { EditorError } from "../../types";
import type { EditorStore } from "../types";

/** 最小半径 */
const MIN_RADIUS = 10;

/**
 * モードアクションを作成
 */
export function createModeActions(store: EditorStore) {
	// ============================================
	// 円形配置モード
	// ============================================

	/**
	 * 円形配置モードに入る
	 */
	const enterCircularMode = (
		center: Position,
		radius: number,
		indices: number[],
	) => {
		store.setState((state) => {
			// 各オブジェクトの初期角度を計算
			const objectAngles = new Map<number, number>();
			for (const idx of indices) {
				const obj = state.board.objects[idx];
				if (obj) {
					const angle = Math.atan2(
						obj.position.y - center.y,
						obj.position.x - center.x,
					);
					objectAngles.set(idx, angle);
				}
			}

			return {
				...state,
				circularMode: {
					center,
					radius: Math.max(radius, MIN_RADIUS),
					participatingIndices: indices,
					objectAngles,
				},
			};
		});
	};

	/**
	 * 円形配置モードを終了
	 */
	const exitCircularMode = () => {
		store.setState((state) => ({
			...state,
			circularMode: null,
		}));
	};

	/**
	 * 円の中心を更新（全オブジェクトを移動）
	 */
	const updateCircularCenter = (center: Position) => {
		store.setState((state) => {
			if (!state.circularMode) return state;

			const oldCenter = state.circularMode.center;
			const deltaX = center.x - oldCenter.x;
			const deltaY = center.y - oldCenter.y;

			let newBoard = cloneBoard(state.board);

			// 参加オブジェクトを移動
			for (const idx of state.circularMode.participatingIndices) {
				const obj = newBoard.objects[idx];
				if (obj) {
					newBoard = updateObjectInBoard(newBoard, idx, {
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
	 * 円の半径を更新（全オブジェクトを新しい半径で再配置）
	 */
	const updateCircularRadius = (radius: number) => {
		store.setState((state) => {
			if (!state.circularMode) return state;

			const newRadius = Math.max(radius, MIN_RADIUS);
			const { center, objectAngles } = state.circularMode;

			let newBoard = cloneBoard(state.board);

			// 各オブジェクトを新しい半径で再配置（角度は保持）
			for (const [idx, angle] of objectAngles) {
				newBoard = updateObjectInBoard(newBoard, idx, {
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

	/**
	 * オブジェクトを円周上で移動
	 */
	const moveObjectOnCircle = (index: number, angle: number) => {
		store.setState((state) => {
			if (!state.circularMode) return state;

			const { center, radius, participatingIndices, objectAngles } =
				state.circularMode;

			// 参加オブジェクトでない場合は無視
			if (!participatingIndices.includes(index)) return state;

			// オブジェクトを新しい角度の位置に移動
			let newBoard = cloneBoard(state.board);
			newBoard = updateObjectInBoard(newBoard, index, {
				position: {
					x: center.x + radius * Math.cos(angle),
					y: center.y + radius * Math.sin(angle),
				},
			});

			// 角度を更新
			const newObjectAngles = new Map(objectAngles);
			newObjectAngles.set(index, angle);

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
	// テキスト編集モード
	// ============================================

	/**
	 * テキスト編集を開始
	 */
	const startTextEdit = (index: number) => {
		store.setState((state) => {
			const obj = state.board.objects[index];

			// テキストオブジェクトのみ編集可能
			if (!obj || obj.objectId !== ObjectIds.Text) {
				return state;
			}

			// ロック中は編集不可
			if (obj.flags.locked) {
				return state;
			}

			return {
				...state,
				editingTextIndex: index,
				selectedIndices: [index],
			};
		});
	};

	/**
	 * テキスト編集を終了
	 */
	const endTextEdit = (save: boolean, text?: string) => {
		store.setState((state) => {
			if (state.editingTextIndex === null) {
				return state;
			}

			const editingIndex = state.editingTextIndex;
			const currentText = state.board.objects[editingIndex]?.text;

			let newState = { ...state, editingTextIndex: null };

			// テキストが実際に変更された場合のみ更新
			if (save && text !== undefined && text !== currentText) {
				// 空文字の場合はデフォルトテキストに戻す
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
	// エラー管理
	// ============================================

	/**
	 * エラーを設定
	 */
	const setError = (error: EditorError) => {
		store.setState((state) => ({
			...state,
			lastError: error,
		}));
	};

	/**
	 * エラーをクリア
	 */
	const clearError = () => {
		store.setState((state) => ({
			...state,
			lastError: null,
		}));
	};

	return {
		// 円形配置モード
		enterCircularMode,
		exitCircularMode,
		updateCircularCenter,
		updateCircularRadius,
		moveObjectOnCircle,
		// テキスト編集
		startTextEdit,
		endTextEdit,
		// エラー管理
		setError,
		clearError,
	};
}

export type ModeActions = ReturnType<typeof createModeActions>;
