/**
 * Boards Provider - collection initialization and fallback management
 *
 * Uses Dexie when IndexedDB is available,
 * falls back to localOnlyCollection otherwise
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

export type StorageMode = "persistent" | "memory";

// biome-ignore lint/suspicious/noExplicitAny: Collection types are incompatible
type AnyCollection = any;

interface BoardsContextValue {
	collection: AnyCollection;
	foldersCollection: AnyCollection;
	storageMode: StorageMode;
	isInitializing: boolean;
}

const BoardsContext = createContext<BoardsContextValue | null>(null);

const dexieCollection = createCollection(
	dexieCollectionOptions({
		id: "boards",
		schema: storedBoardSchema,
		getKey: (item) => item.id,
		dbName: "strategy-board-editor",
		tableName: "boards",
	}),
);

const localOnlyCollection = createCollection(
	localOnlyCollectionOptions({
		id: "boards-memory",
		schema: storedBoardSchema,
		getKey: (item) => item.id,
	}),
);

const dexieFoldersCollection = createCollection(
	dexieCollectionOptions({
		id: "folders",
		schema: storedFolderSchema,
		getKey: (item) => item.id,
		dbName: "strategy-board-editor",
		tableName: "folders",
	}),
);

const localOnlyFoldersCollection = createCollection(
	localOnlyCollectionOptions({
		id: "folders-memory",
		schema: storedFolderSchema,
		getKey: (item) => item.id,
	}),
);

async function checkIndexedDBAvailable(): Promise<boolean> {
	if (typeof indexedDB === "undefined") {
		return false;
	}

	try {
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
			setTimeout(() => resolve(false), 1000);
		});
	} catch {
		return false;
	}
}

interface BoardsProviderProps {
	children: ReactNode;
}

export function BoardsProvider({ children }: BoardsProviderProps) {
	const [storageMode, setStorageMode] = useState<StorageMode>("persistent");
	const [isInitializing, setIsInitializing] = useState(true);

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

export function useBoardsContext(): BoardsContextValue {
	const context = useContext(BoardsContext);
	if (!context) {
		throw new Error("useBoardsContext must be used within a BoardsProvider");
	}
	return context;
}

export function useStorageMode(): StorageMode {
	return useBoardsContext().storageMode;
}

export function useIsPersistent(): boolean {
	return useBoardsContext().storageMode === "persistent";
}
