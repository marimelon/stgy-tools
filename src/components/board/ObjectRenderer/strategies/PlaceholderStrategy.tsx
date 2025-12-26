import { PlaceholderObject } from "../objects/PlaceholderObject";
import type { RenderProps, RenderStrategy } from "./types";

export const PlaceholderStrategy: RenderStrategy = {
	render({ object, transform }: RenderProps) {
		const { objectId } = object;
		return <PlaceholderObject objectId={objectId} transform={transform} />;
	},
};
