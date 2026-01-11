import { useTranslation } from "react-i18next";
import type { BoardObject } from "@/lib/stgy";
import { ObjectListItem } from "./ObjectListItem";

interface ObjectListPanelProps {
	objects: BoardObject[];
	selectedObjectId: string | null;
	onSelectObject: (objectId: string | null, object: BoardObject | null) => void;
}

export function ObjectListPanel({
	objects,
	selectedObjectId,
	onSelectObject,
}: ObjectListPanelProps) {
	const { t } = useTranslation();

	const handleSelect = (objectId: string) => {
		if (selectedObjectId === objectId) {
			onSelectObject(null, null);
		} else {
			const obj = objects.find((o) => o.id === objectId);
			onSelectObject(objectId, obj ?? null);
		}
	};

	return (
		<div className="flex flex-col h-full bg-card border border-border rounded-lg">
			<div className="px-4 py-3 border-b border-border flex-shrink-0">
				<h2 className="text-sm font-semibold">
					{t("viewer.objectList.title")}
				</h2>
			</div>

			<div className="flex-1 overflow-y-auto">
				{objects.length === 0 ? (
					<div className="p-4 text-sm text-center text-muted-foreground">
						{t("viewer.objectList.empty")}
					</div>
				) : (
					<div className="py-1">
						{objects.map((obj, index) => (
							<ObjectListItem
								key={obj.id}
								index={index}
								object={obj}
								isSelected={selectedObjectId === obj.id}
								onSelect={() => handleSelect(obj.id)}
							/>
						))}
					</div>
				)}
			</div>

			<div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex-shrink-0">
				<span className="font-mono">
					<span className="text-primary">{objects.length}</span>{" "}
					{t("viewer.objectList.count")}
				</span>
			</div>
		</div>
	);
}
