/**
 * デバッグモード管理フック
 *
 * localStorageを使用してデバッグモードの状態を永続化
 * カスタムイベントを使用して複数コンポーネント間で同期
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "debugObjectPalette";
const DEBUG_MODE_CHANGE_EVENT = "debugModeChange";

/**
 * デバッグモードの状態を取得
 */
export function getDebugMode(): boolean {
	if (typeof window === "undefined") return false;
	return localStorage.getItem(STORAGE_KEY) === "true";
}

/**
 * デバッグモードの状態を保存し、イベントを発火
 */
export function setDebugMode(enabled: boolean): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
	// カスタムイベントを発火して他のコンポーネントに通知
	window.dispatchEvent(
		new CustomEvent(DEBUG_MODE_CHANGE_EVENT, { detail: enabled }),
	);
}

/**
 * デバッグモード管理フック
 *
 * 複数のコンポーネントで使用しても、状態が同期される
 */
export function useDebugMode() {
	const [debugMode, setDebugModeState] = useState(false);

	// 初期化時にlocalStorageからデバッグモードを読み込み
	// + 他のコンポーネントからの変更をリッスン
	useEffect(() => {
		// 初期値を設定
		setDebugModeState(getDebugMode());

		// 他のコンポーネントからの変更をリッスン
		const handleDebugModeChange = (event: CustomEvent<boolean>) => {
			setDebugModeState(event.detail);
		};

		window.addEventListener(
			DEBUG_MODE_CHANGE_EVENT,
			handleDebugModeChange as EventListener,
		);

		return () => {
			window.removeEventListener(
				DEBUG_MODE_CHANGE_EVENT,
				handleDebugModeChange as EventListener,
			);
		};
	}, []);

	const toggleDebugMode = useCallback(() => {
		const newValue = !debugMode;
		setDebugModeState(newValue);
		setDebugMode(newValue);
	}, [debugMode]);

	const setMode = useCallback((enabled: boolean) => {
		setDebugModeState(enabled);
		setDebugMode(enabled);
	}, []);

	return {
		debugMode,
		toggleDebugMode,
		setDebugMode: setMode,
	};
}
