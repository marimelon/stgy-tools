/**
 * Board storage module exports
 */

export { boardsCollection } from "./collection";
export {
	type BoardSortOption,
	type BoardsError,
	type BoardsErrorType,
	type SortDirection,
	type UseBoardsOptions,
	useBoards,
} from "./hooks";
export type { StoredBoard } from "./schema";
export { DEFAULT_GRID_SETTINGS, storedBoardSchema } from "./schema";
