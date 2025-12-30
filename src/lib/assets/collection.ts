/**
 * TanStack DB collection for asset storage with Dexie (IndexedDB)
 */

import { createCollection } from "@tanstack/react-db";
import { dexieCollectionOptions } from "tanstack-dexie-db-collection";
import { storedAssetSchema } from "./schema";

export const assetsCollection = createCollection(
	// @ts-expect-error - tanstack-dexie-db-collection uses older @tanstack/db types
	dexieCollectionOptions({
		id: "assets",
		schema: storedAssetSchema,
		getKey: (item) => item.id,
		dbName: "strategy-board-editor",
		tableName: "assets",
	}),
);
