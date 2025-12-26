import { JobIcon } from "../objects/JobIcon";
import type { RenderProps, RenderStrategy } from "./types";

export const JobIconStrategy: RenderStrategy = {
	render({ object, transform }: RenderProps) {
		const { objectId } = object;
		return <JobIcon objectId={objectId} transform={transform} />;
	},
};
