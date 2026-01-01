/**
 * Board tab component types
 */

/** Tab information */
export interface TabInfo {
	id: string;
	name: string;
	isActive: boolean;
	hasUnsavedChanges: boolean;
}
