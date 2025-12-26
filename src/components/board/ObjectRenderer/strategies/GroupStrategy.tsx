import { CustomIconImage } from "../utils";
import type { RenderProps, RenderStrategy } from "./types";

export const GroupStrategy: RenderStrategy = {
	render({ object, transform }: RenderProps) {
		const { objectId } = object;
		return <CustomIconImage objectId={objectId} transform={transform} />;
	},
};
