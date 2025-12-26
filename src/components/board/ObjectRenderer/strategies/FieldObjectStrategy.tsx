import { FieldObject } from "../objects/FieldObject";
import type { RenderProps, RenderStrategy } from "./types";

export const FieldObjectStrategy: RenderStrategy = {
	render({ object, transform }: RenderProps) {
		const { objectId, color } = object;
		return (
			<FieldObject objectId={objectId} transform={transform} color={color} />
		);
	},
};
