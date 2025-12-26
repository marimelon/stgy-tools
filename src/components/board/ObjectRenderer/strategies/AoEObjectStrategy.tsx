import { AoEObject } from "../objects/AoEObject";
import type { RenderProps, RenderStrategy } from "./types";

export const AoEObjectStrategy: RenderStrategy = {
	render({ object, transform }: RenderProps) {
		const { objectId, color, param1, param2, param3 } = object;
		return (
			<AoEObject
				objectId={objectId}
				transform={transform}
				color={color}
				param1={param1}
				param2={param2}
				param3={param3}
			/>
		);
	},
};
