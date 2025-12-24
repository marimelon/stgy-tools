/**
 * オブジェクト一覧パネルコンポーネント
 *
 * BoardDataの全オブジェクトをリスト表示
 * クリックで選択し、BoardViewerと連動
 */

import { useTranslation } from "react-i18next";
import type { BoardObject } from "@/lib/stgy";
import { ObjectListItem } from "./ObjectListItem";

interface ObjectListPanelProps {
	objects: BoardObject[];
	selectedIndex: number | null;
	onSelectObject: (index: number | null, object: BoardObject | null) => void;
}

/**
 * オブジェクト一覧パネル
 */
export function ObjectListPanel({
	objects,
	selectedIndex,
	onSelectObject,
}: ObjectListPanelProps) {
	const { t } = useTranslation();

	const handleSelect = (index: number) => {
		// 同じオブジェクトをクリックしたら選択解除
		if (selectedIndex === index) {
			onSelectObject(null, null);
		} else {
			onSelectObject(index, objects[index]);
		}
	};

	return (
		<div className="flex flex-col h-full bg-card border border-border rounded-lg">
			{/* ヘッダー */}
			<div className="px-4 py-3 border-b border-border flex-shrink-0">
				<h2 className="text-sm font-semibold">
					{t("viewer.objectList.title")}
				</h2>
			</div>

			{/* リスト */}
			<div className="flex-1 overflow-y-auto">
				{objects.length === 0 ? (
					<div className="p-4 text-sm text-center text-muted-foreground">
						{t("viewer.objectList.empty")}
					</div>
				) : (
					<div className="py-1">
						{objects.map((obj, index) => (
							<ObjectListItem
								key={`${obj.objectId}-${obj.position.x}-${obj.position.y}-${index}`}
								index={index}
								object={obj}
								isSelected={selectedIndex === index}
								onSelect={handleSelect}
							/>
						))}
					</div>
				)}
			</div>

			{/* フッター: オブジェクト数 */}
			<div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex-shrink-0">
				<span className="font-mono">
					<span className="text-primary">{objects.length}</span>{" "}
					{t("viewer.objectList.count")}
				</span>
			</div>
		</div>
	);
}
