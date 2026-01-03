/**
 * 整列操作アクション
 */

import i18n from "@/lib/i18n";
import type { AlignmentType, CircularModeState } from "../../types";
import { cloneBoard, pushHistory, updateObjectInBoard } from "../../utils";
import type { EditorStore } from "../types";

/** 整列タイプの説明キー */
const ALIGNMENT_DESCRIPTION_KEYS: Record<AlignmentType, string> = {
	left: "history.alignLeft",
	center: "history.alignCenterH",
	right: "history.alignRight",
	top: "history.alignTop",
	middle: "history.alignCenterV",
	bottom: "history.alignBottom",
	"distribute-h": "history.distributeH",
	"distribute-v": "history.distributeV",
	circular: "history.circularArrangement",
};

/**
 * 整列アクションを作成
 */
export function createAlignmentActions(store: EditorStore) {
	/**
	 * オブジェクトを整列
	 */
	const alignObjects = (objectIds: string[], alignment: AlignmentType) => {
		if (objectIds.length < 2) return;

		store.setState((state) => {
			// 有効なオブジェクトのみフィルタ
			const validObjects = objectIds
				.map((id) => state.board.objects.find((obj) => obj.id === id))
				.filter((obj): obj is NonNullable<typeof obj> => obj !== undefined);
			if (validObjects.length < 2) return state;

			const validIds = validObjects.map((obj) => obj.id);

			// 位置の境界を計算
			const positions = validObjects.map((obj) => obj.position);
			const minX = Math.min(...positions.map((p) => p.x));
			const maxX = Math.max(...positions.map((p) => p.x));
			const minY = Math.min(...positions.map((p) => p.y));
			const maxY = Math.max(...positions.map((p) => p.y));
			const centerX = (minX + maxX) / 2;
			const centerY = (minY + maxY) / 2;

			let newBoard = cloneBoard(state.board);

			// 整列タイプに応じて位置を更新
			switch (alignment) {
				case "left":
					for (const id of validIds) {
						const obj = newBoard.objects.find((o) => o.id === id);
						if (obj) {
							newBoard = updateObjectInBoard(newBoard, id, {
								position: { ...obj.position, x: minX },
							});
						}
					}
					break;
				case "center":
					for (const id of validIds) {
						const obj = newBoard.objects.find((o) => o.id === id);
						if (obj) {
							newBoard = updateObjectInBoard(newBoard, id, {
								position: { ...obj.position, x: centerX },
							});
						}
					}
					break;
				case "right":
					for (const id of validIds) {
						const obj = newBoard.objects.find((o) => o.id === id);
						if (obj) {
							newBoard = updateObjectInBoard(newBoard, id, {
								position: { ...obj.position, x: maxX },
							});
						}
					}
					break;
				case "top":
					for (const id of validIds) {
						const obj = newBoard.objects.find((o) => o.id === id);
						if (obj) {
							newBoard = updateObjectInBoard(newBoard, id, {
								position: { ...obj.position, y: minY },
							});
						}
					}
					break;
				case "middle":
					for (const id of validIds) {
						const obj = newBoard.objects.find((o) => o.id === id);
						if (obj) {
							newBoard = updateObjectInBoard(newBoard, id, {
								position: { ...obj.position, y: centerY },
							});
						}
					}
					break;
				case "bottom":
					for (const id of validIds) {
						const obj = newBoard.objects.find((o) => o.id === id);
						if (obj) {
							newBoard = updateObjectInBoard(newBoard, id, {
								position: { ...obj.position, y: maxY },
							});
						}
					}
					break;
				case "distribute-h": {
					// X座標でソート
					const sortedByX = [...validObjects].sort(
						(a, b) => a.position.x - b.position.x,
					);
					if (sortedByX.length >= 2) {
						const step = (maxX - minX) / (sortedByX.length - 1);
						for (let i = 0; i < sortedByX.length; i++) {
							const obj = sortedByX[i];
							newBoard = updateObjectInBoard(newBoard, obj.id, {
								position: {
									...obj.position,
									x: minX + step * i,
								},
							});
						}
					}
					break;
				}
				case "distribute-v": {
					// Y座標でソート
					const sortedByY = [...validObjects].sort(
						(a, b) => a.position.y - b.position.y,
					);
					if (sortedByY.length >= 2) {
						const step = (maxY - minY) / (sortedByY.length - 1);
						for (let i = 0; i < sortedByY.length; i++) {
							const obj = sortedByY[i];
							newBoard = updateObjectInBoard(newBoard, obj.id, {
								position: {
									...obj.position,
									y: minY + step * i,
								},
							});
						}
					}
					break;
				}
				case "circular": {
					// 円の中心と半径を決定
					let circleCenterX: number;
					let circleCenterY: number;
					let circularRadius: number;

					if (state.circularMode) {
						// 既に円形モード中の場合は、既存の中心と半径を維持
						circleCenterX = state.circularMode.center.x;
						circleCenterY = state.circularMode.center.y;
						circularRadius = state.circularMode.radius;
					} else {
						// 新規: バウンディングボックスの中心を使用（安定した結果のため）
						circleCenterX = centerX;
						circleCenterY = centerY;

						// 中心からの最大距離を半径とする
						// 最小半径は50に制限
						const calculatedRadius = Math.max(
							...positions.map((p) =>
								Math.sqrt(
									(p.x - circleCenterX) ** 2 + (p.y - circleCenterY) ** 2,
								),
							),
						);
						circularRadius = Math.max(50, calculatedRadius);
					}

					// 各オブジェクトの角度を計算・保存
					const objectAngles = new Map<string, number>();

					// 各オブジェクトの元の角度を保持したまま、半径だけを揃えて円周上に配置
					for (let i = 0; i < validObjects.length; i++) {
						const obj = validObjects[i];
						const pos = positions[i];
						// 現在の角度を計算
						const angle = Math.atan2(
							pos.y - circleCenterY,
							pos.x - circleCenterX,
						);
						objectAngles.set(obj.id, angle);
						// 同じ角度で半径を揃える
						newBoard = updateObjectInBoard(newBoard, obj.id, {
							position: {
								x: circleCenterX + circularRadius * Math.cos(angle),
								y: circleCenterY + circularRadius * Math.sin(angle),
							},
						});
					}

					// 円形配置モードを有効化
					const circularModeState: CircularModeState = {
						center: { x: circleCenterX, y: circleCenterY },
						radius: circularRadius,
						participatingIds: validIds,
						objectAngles,
					};

					return {
						...state,
						board: newBoard,
						circularMode: circularModeState,
						...pushHistory(
							state,
							i18n.t(ALIGNMENT_DESCRIPTION_KEYS[alignment]),
						),
					};
				}
			}

			return {
				...state,
				board: newBoard,
				...pushHistory(state, i18n.t(ALIGNMENT_DESCRIPTION_KEYS[alignment])),
			};
		});
	};

	/**
	 * 選択オブジェクトを整列
	 */
	const alignSelected = (alignment: AlignmentType) => {
		const state = store.state;
		if (state.selectedIds.length < 2) return;
		alignObjects(state.selectedIds, alignment);
	};

	return {
		alignObjects,
		alignSelected,
	};
}

export type AlignmentActions = ReturnType<typeof createAlignmentActions>;
