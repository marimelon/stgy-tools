/**
 * Board storage module exports
 */

export { boardsCollection } from "./collection";
export { storedBoardSchema, DEFAULT_GRID_SETTINGS } from "./schema";
export type { StoredBoard } from "./schema";
export {
	useBoards,
	type UseBoardsOptions,
	type BoardSortOption,
	type SortDirection,
} from "./hooks";
