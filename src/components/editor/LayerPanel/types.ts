/**
 * Layer panel types
 */

import type { ObjectGroup } from "@/lib/editor/types";

export interface DropTarget {
	index: number;
	position: "before" | "after";
}

export interface LayerItem {
	type: "object" | "group-header";
	objectId?: string;
	group?: ObjectGroup;
	isInGroup: boolean;
	groupId?: string;
	isLastInGroup?: boolean;
}

export type LayerContextMenuTarget =
	| { type: "object"; objectId: string; isInGroup: boolean; groupId?: string }
	| { type: "group"; group: ObjectGroup };

export interface LayerContextMenuState {
	isOpen: boolean;
	x: number;
	y: number;
	target: LayerContextMenuTarget | null;
}
