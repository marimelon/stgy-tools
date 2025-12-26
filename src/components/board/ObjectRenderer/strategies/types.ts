import type { BoardObject } from "@/lib/stgy";

export interface RenderStrategy {
	render(props: RenderProps): React.ReactNode;
}

export interface RenderProps {
	object: BoardObject;
	transform: string;
	scale: number;
}

export type TypeGuard = (objectId: number) => boolean;

export interface StrategyEntry {
	guard: TypeGuard;
	strategy: RenderStrategy;
}
