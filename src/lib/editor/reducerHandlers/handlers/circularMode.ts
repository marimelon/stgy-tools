/**
 * 円形配置モードハンドラー
 */

import type { Position } from "@/lib/stgy";
import type { EditorState } from "../../types";
import { cloneBoard, findObjectById, updateObjectInBoard } from "../utils";

/** 最小半径 */
const MIN_RADIUS = 10;

/**
 * 円形配置モードに入る
 */
export function handleEnterCircularMode(
	state: EditorState,
	payload: { center: Position; radius: number; objectIds: string[] },
): EditorState {
	const { center, radius, objectIds } = payload;

	// 各オブジェクトの初期角度を計算
	const objectAngles = new Map<string, number>();
	for (const objectId of objectIds) {
		const obj = findObjectById(state.board, objectId);
		if (obj) {
			const angle = Math.atan2(
				obj.position.y - center.y,
				obj.position.x - center.x,
			);
			objectAngles.set(objectId, angle);
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
}

/**
 * 円形配置モードを終了
 */
export function handleExitCircularMode(state: EditorState): EditorState {
	return {
		...state,
		circularMode: null,
	};
}

/**
 * 円の中心を更新（全オブジェクトを移動）
 */
export function handleUpdateCircularCenter(
	state: EditorState,
	payload: { center: Position },
): EditorState {
	if (!state.circularMode) return state;

	const { center } = payload;
	const oldCenter = state.circularMode.center;
	const deltaX = center.x - oldCenter.x;
	const deltaY = center.y - oldCenter.y;

	let newBoard = cloneBoard(state.board);

	// 参加オブジェクトを移動
	for (const objectId of state.circularMode.participatingIds) {
		const obj = findObjectById(newBoard, objectId);
		if (obj) {
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
		circularMode: {
			...state.circularMode,
			center,
		},
	};
}

/**
 * 円の半径を更新（全オブジェクトを新しい半径で再配置）
 */
export function handleUpdateCircularRadius(
	state: EditorState,
	payload: { radius: number },
): EditorState {
	if (!state.circularMode) return state;

	const radius = Math.max(payload.radius, MIN_RADIUS);
	const { center, objectAngles } = state.circularMode;

	let newBoard = cloneBoard(state.board);

	// 各オブジェクトを新しい半径で再配置（角度は保持）
	for (const [objectId, angle] of objectAngles) {
		newBoard = updateObjectInBoard(newBoard, objectId, {
			position: {
				x: center.x + radius * Math.cos(angle),
				y: center.y + radius * Math.sin(angle),
			},
		});
	}

	return {
		...state,
		board: newBoard,
		circularMode: {
			...state.circularMode,
			radius,
		},
	};
}

/**
 * オブジェクトを円周上で移動
 */
export function handleMoveObjectOnCircle(
	state: EditorState,
	payload: { objectId: string; angle: number },
): EditorState {
	if (!state.circularMode) return state;

	const { objectId, angle } = payload;
	const { center, radius, participatingIds, objectAngles } = state.circularMode;

	// 参加オブジェクトでない場合は無視
	if (!participatingIds.includes(objectId)) return state;

	// オブジェクトを新しい角度の位置に移動
	let newBoard = cloneBoard(state.board);
	newBoard = updateObjectInBoard(newBoard, objectId, {
		position: {
			x: center.x + radius * Math.cos(angle),
			y: center.y + radius * Math.sin(angle),
		},
	});

	// 角度を更新
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
}
