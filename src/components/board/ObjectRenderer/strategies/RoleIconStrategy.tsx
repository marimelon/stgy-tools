import { RoleIcon } from "../objects/RoleIcon";
import type { RenderProps, RenderStrategy } from "./types";

export const RoleIconStrategy: RenderStrategy = {
	render({ object, transform }: RenderProps) {
		const { objectId } = object;
		return <RoleIcon objectId={objectId} transform={transform} />;
	},
};
