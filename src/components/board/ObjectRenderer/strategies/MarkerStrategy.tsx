import { MarkerIcon } from "../objects/markers/MarkerIcon";
import type { RenderProps, RenderStrategy } from "./types";

export const MarkerStrategy: RenderStrategy = {
	render({ object, transform }: RenderProps) {
		const { objectId } = object;
		return <MarkerIcon objectId={objectId} transform={transform} />;
	},
};
