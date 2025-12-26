import { EnemyIcon } from "../objects/EnemyIcon";
import type { RenderProps, RenderStrategy } from "./types";

export const EnemyStrategy: RenderStrategy = {
	render({ object, transform }: RenderProps) {
		const { objectId } = object;
		return <EnemyIcon objectId={objectId} transform={transform} />;
	},
};
