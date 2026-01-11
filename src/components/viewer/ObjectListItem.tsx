import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BoardObject } from "@/lib/stgy";
import { ObjectNames } from "@/lib/stgy";

interface ObjectListItemProps {
	index: number;
	object: BoardObject;
	isSelected: boolean;
	onSelect: () => void;
}

export function ObjectListItem({
	index,
	object,
	isSelected,
	onSelect,
}: ObjectListItemProps) {
	const { t } = useTranslation();

	const objectName =
		t(`object.${object.objectId}`, { defaultValue: "" }) ||
		ObjectNames[object.objectId] ||
		`ID: ${object.objectId}`;

	const isVisible = object.flags.visible;

	const fullText = object.text ? `${objectName} "${object.text}"` : objectName;

	return (
		<button
			type="button"
			onClick={onSelect}
			title={fullText}
			className={`
				w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm
				transition-colors hover:bg-accent/10
				${isSelected ? "bg-accent/20 border-l-2 border-l-accent" : "border-l-2 border-l-transparent"}
				${!isVisible ? "opacity-50" : ""}
			`}
		>
			<span className="text-xs font-mono text-muted-foreground w-6 flex-shrink-0">
				#{index}
			</span>

			<span
				className={`flex-shrink-0 ${isVisible ? "text-muted-foreground" : "text-muted-foreground/50"}`}
			>
				{isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
			</span>

			<span className="flex-1 truncate">
				{objectName}
				{object.text && (
					<span className="text-muted-foreground ml-1">"{object.text}"</span>
				)}
			</span>
		</button>
	);
}
