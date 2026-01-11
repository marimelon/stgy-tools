import { ObjectIds } from "@/lib/stgy";
import {
	isAoEObject,
	isEnemy,
	isFieldObject,
	isJobIcon,
	isMarker,
	isRoleIcon,
	isWaymark,
} from "../type-guards";
import { AoEObjectStrategy } from "./AoEObjectStrategy";
import { EnemyStrategy } from "./EnemyStrategy";
import { FieldObjectStrategy } from "./FieldObjectStrategy";
import { GroupStrategy } from "./GroupStrategy";
import { JobIconStrategy } from "./JobIconStrategy";
import { LineStrategy } from "./LineStrategy";
import { MarkerStrategy } from "./MarkerStrategy";
import { PlaceholderStrategy } from "./PlaceholderStrategy";
import { RoleIconStrategy } from "./RoleIconStrategy";
import { TextStrategy } from "./TextStrategy";
import type { RenderStrategy, StrategyEntry } from "./types";
import { WaymarkStrategy } from "./WaymarkStrategy";

export const RENDER_STRATEGIES: ReadonlyArray<StrategyEntry> = [
	// Specific ID checks (high priority)
	{ guard: (id) => id === ObjectIds.Line, strategy: LineStrategy },
	{ guard: (id) => id === ObjectIds.Text, strategy: TextStrategy },
	{ guard: (id) => id === ObjectIds.Group, strategy: GroupStrategy },

	// Category checks
	{ guard: isFieldObject, strategy: FieldObjectStrategy },
	{ guard: isAoEObject, strategy: AoEObjectStrategy },
	{ guard: isJobIcon, strategy: JobIconStrategy },
	{ guard: isRoleIcon, strategy: RoleIconStrategy },
	{ guard: isWaymark, strategy: WaymarkStrategy },
	{ guard: isEnemy, strategy: EnemyStrategy },
	{ guard: isMarker, strategy: MarkerStrategy },
] as const;

export const FALLBACK_STRATEGY = PlaceholderStrategy;

export function getStrategy(objectId: number): RenderStrategy {
	const entry = RENDER_STRATEGIES.find((e) => e.guard(objectId));
	return entry ? entry.strategy : FALLBACK_STRATEGY;
}

export type { RenderProps, RenderStrategy } from "./types";
