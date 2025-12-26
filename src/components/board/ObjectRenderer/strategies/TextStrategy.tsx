import i18n from "@/lib/i18n";
import { TextObject } from "../objects/TextObject";
import type { RenderProps, RenderStrategy } from "./types";

export const TextStrategy: RenderStrategy = {
	render({ object, transform }: RenderProps) {
		const { text, color } = object;
		return (
			<TextObject
				transform={transform}
				text={text || i18n.t("common.defaultText")}
				color={color}
			/>
		);
	},
};
