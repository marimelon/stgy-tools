/**
 * TanStack DB collection for board storage with Dexie (IndexedDB)
 */

import { createCollection } from "@tanstack/react-db";
import { dexieCollectionOptions } from "tanstack-dexie-db-collection";
import { storedBoardSchema } from "./schema";

export const boardsCollection = createCollection(
	dexieCollectionOptions({
		id: "boards",
		schema: storedBoardSchema,
		getKey: (item) => item.id,
		dbName: "strategy-board-editor",
		tableName: "boards",
	}),
);
