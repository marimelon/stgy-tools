/**
 * Boards Provider - コレクションの初期化とフォールバック管理
 *
 * IndexedDBが利用可能な場合はDexieを使用し、
 * 利用不可の場合はlocalOnlyCollectionにフォールバックする
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from "@tanstack/react-db";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { dexieCollectionOptions } from "tanstack-dexie-db-collection";
import { storedBoardSchema, storedFolderSchema } from "./schema";

/** ストレージモード */
export type StorageMode = "persistent" | "memory";

// Dexie collection と localOnly collection の型が互換性がないため any を使用
// biome-ignore lint/suspicious/noExplicitAny: Collection types are incompatible
type AnyCollection = any;

/** コンテキストの型 */
interface BoardsContextValue {
	/** アクティブなボードコレクション */
	collection: AnyCollection;
	/** アクティブなフォルダコレクション */
	foldersCollection: AnyCollection;
	/** ストレージモード */
	storageMode: StorageMode;
	/** 初期化中かどうか */
	isInitializing: boolean;
}

const BoardsContext = createContext<BoardsContextValue | null>(null);

/** Dexie (IndexedDB) コレクション */
const dexieCollection = createCollection(
	dexieCollectionOptions({
		id: "boards",
		schema: storedBoardSchema,
		getKey: (item) => item.id,
		dbName: "strategy-board-editor",
		tableName: "boards",
	}),
);

/** メモリのみのコレクション（フォールバック用） */
const localOnlyCollection = createCollection(
	localOnlyCollectionOptions({
		id: "boards-memory",
		schema: storedBoardSchema,
		getKey: (item) => item.id,
	}),
);

/** Dexie (IndexedDB) フォルダコレクション */
const dexieFoldersCollection = createCollection(
	dexieCollectionOptions({
		id: "folders",
		schema: storedFolderSchema,
		getKey: (item) => item.id,
		dbName: "strategy-board-editor",
		tableName: "folders",
	}),
);

/** メモリのみのフォルダコレクション（フォールバック用） */
const localOnlyFoldersCollection = createCollection(
	localOnlyCollectionOptions({
		id: "folders-memory",
		schema: storedFolderSchema,
		getKey: (item) => item.id,
	}),
);

/**
 * IndexedDBが利用可能かチェック
 */
async function checkIndexedDBAvailable(): Promise<boolean> {
	if (typeof indexedDB === "undefined") {
		return false;
	}

	try {
		// 実際にDBを開いてみてテスト
		const testDbName = "__indexeddb_test__";
		const request = indexedDB.open(testDbName);

		return new Promise((resolve) => {
			request.onerror = () => {
				resolve(false);
			};
			request.onsuccess = () => {
				request.result.close();
				indexedDB.deleteDatabase(testDbName);
				resolve(true);
			};
			// タイムアウト対策
			setTimeout(() => resolve(false), 1000);
		});
	} catch {
		return false;
	}
}

interface BoardsProviderProps {
	children: ReactNode;
}

/**
 * Boards Provider コンポーネント
 */
export function BoardsProvider({ children }: BoardsProviderProps) {
	const [storageMode, setStorageMode] = useState<StorageMode>("persistent");
	const [isInitializing, setIsInitializing] = useState(true);

	// 初期化時にIndexedDBの利用可否をチェック
	useEffect(() => {
		let mounted = true;

		checkIndexedDBAvailable().then((available) => {
			if (!mounted) return;

			if (!available) {
				console.warn(
					"IndexedDB is not available. Falling back to in-memory storage.",
				);
				setStorageMode("memory");
			}
			setIsInitializing(false);
		});

		return () => {
			mounted = false;
		};
	}, []);

	const collection = useMemo(
		() =>
			storageMode === "persistent" ? dexieCollection : localOnlyCollection,
		[storageMode],
	);

	const foldersCollection = useMemo(
		() =>
			storageMode === "persistent"
				? dexieFoldersCollection
				: localOnlyFoldersCollection,
		[storageMode],
	);

	const value = useMemo(
		() => ({
			collection,
			foldersCollection,
			storageMode,
			isInitializing,
		}),
		[collection, foldersCollection, storageMode, isInitializing],
	);

	return (
		<BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>
	);
}

/**
 * Boards コンテキストを取得するフック
 */
export function useBoardsContext(): BoardsContextValue {
	const context = useContext(BoardsContext);
	if (!context) {
		throw new Error("useBoardsContext must be used within a BoardsProvider");
	}
	return context;
}

/**
 * ストレージモードのみを取得するフック
 */
export function useStorageMode(): StorageMode {
	return useBoardsContext().storageMode;
}

/**
 * 永続ストレージが使用されているかどうか
 */
export function useIsPersistent(): boolean {
	return useBoardsContext().storageMode === "persistent";
}
