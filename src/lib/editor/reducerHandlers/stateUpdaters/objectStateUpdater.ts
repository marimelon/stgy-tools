/**
 * オブジェクト状態更新ユーティリティ
 */

import type { BoardData, BoardObject, Position } from "@/lib/stgy";
import { cloneBoard, updateObjectInBoard } from "../utils";

/**
 * 位置更新のMapを適用してボードを更新
 * @param board 現在のボードデータ
 * @param updates インデックス → 位置のMap
 * @returns 更新されたボードデータ
 */
export function applyPositionUpdates(
	board: BoardData,
	updates: Map<number, Position>,
): BoardData {
	let newBoard = cloneBoard(board);
	for (const [index, position] of updates) {
		newBoard = updateObjectInBoard(newBoard, index, { position });
	}
	return newBoard;
}

/**
 * オブジェクト更新のMapを適用してボードを更新
 * @param board 現在のボードデータ
 * @param updates インデックス → オブジェクト更新のMap
 * @returns 更新されたボードデータ
 */
export function applyObjectUpdates(
	board: BoardData,
	updates: Map<number, Partial<BoardObject>>,
): BoardData {
	let newBoard = cloneBoard(board);
	for (const [index, update] of updates) {
		newBoard = updateObjectInBoard(newBoard, index, update);
	}
	return newBoard;
}

/**
 * ボードの先頭にオブジェクトを追加
 * @param board 現在のボードデータ
 * @param objects 追加するオブジェクト配列
 * @returns 更新されたボードデータ
 */
export function addObjectsToFront(
	board: BoardData,
	objects: BoardObject[],
): BoardData {
	const newBoard = cloneBoard(board);
	newBoard.objects.unshift(...objects);
	return newBoard;
}

/**
 * ボードの末尾にオブジェクトを追加
 * @param board 現在のボードデータ
 * @param objects 追加するオブジェクト配列
 * @returns 更新されたボードデータ
 */
export function addObjectsToEnd(
	board: BoardData,
	objects: BoardObject[],
): BoardData {
	const newBoard = cloneBoard(board);
	newBoard.objects.push(...objects);
	return newBoard;
}

/**
 * 指定されたインデックスのオブジェクトを削除
 * @param board 現在のボードデータ
 * @param indices 削除するインデックス配列
 * @returns 更新されたボードデータ
 */
export function removeObjectsFromBoard(
	board: BoardData,
	indices: number[],
): BoardData {
	const newBoard = cloneBoard(board);
	// インデックスを降順でソートして削除 (インデックスのずれを防ぐ)
	const sortedIndices = [...indices].sort((a, b) => b - a);
	for (const index of sortedIndices) {
		if (index >= 0 && index < newBoard.objects.length) {
			newBoard.objects.splice(index, 1);
		}
	}
	return newBoard;
}

/**
 * オブジェクトを指定位置に移動
 * @param board 現在のボードデータ
 * @param fromIndex 移動元インデックス
 * @param toIndex 移動先インデックス
 * @returns 更新されたボードデータ
 */
export function moveObjectInBoard(
	board: BoardData,
	fromIndex: number,
	toIndex: number,
): BoardData {
	const newBoard = cloneBoard(board);
	const [movedObject] = newBoard.objects.splice(fromIndex, 1);
	newBoard.objects.splice(toIndex, 0, movedObject);
	return newBoard;
}

/**
 * 複数のオブジェクトを削除して指定位置に挿入
 * @param board 現在のボードデータ
 * @param indices 削除するインデックス配列（ソート済み）
 * @param insertAt 挿入位置
 * @returns 更新されたボードデータ
 */
export function moveMultipleObjects(
	board: BoardData,
	indices: number[],
	insertAt: number,
): BoardData {
	const newBoard = cloneBoard(board);

	// オブジェクトを取り出す
	const objects = indices.map((i) => newBoard.objects[i]);

	// 削除（後ろから削除してインデックスがずれないように）
	for (let i = indices.length - 1; i >= 0; i--) {
		newBoard.objects.splice(indices[i], 1);
	}

	// 挿入
	newBoard.objects.splice(insertAt, 0, ...objects);

	return newBoard;
}
