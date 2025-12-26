import { WaymarkIcon } from "../objects/WaymarkIcon";
import type { RenderProps, RenderStrategy } from "./types";

export const WaymarkStrategy: RenderStrategy = {
	render({ object, transform }: RenderProps) {
		const { objectId } = object;
		return <WaymarkIcon objectId={objectId} transform={transform} />;
	},
};
