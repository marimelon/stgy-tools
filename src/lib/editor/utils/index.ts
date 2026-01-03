/**
 * エディターユーティリティのエクスポート
 */

export {
	cloneBoard,
	findObjectById,
	findObjectIndex,
	generateGroupId,
	generateHistoryId,
	MAX_HISTORY,
	pushHistory,
	updateGroupsAfterDelete,
	updateObjectInBoard,
} from "./stateUtils";

export type { ValidationResult } from "./validation";
export { canAddObject, canAddObjects } from "./validation";
