/**
 * ボードプロパティパネルコンポーネント
 *
 * shadcn/ui ベースのボード設定パネル
 */

import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { BackgroundId, BoardData } from "@/lib/stgy";
import { BackgroundId as BgId } from "@/lib/stgy";
import { PropertySection } from "./FormInputs";

/** 背景ID一覧 */
const BACKGROUND_IDS: BackgroundId[] = [
	BgId.None,
	BgId.FullCheck,
	BgId.CircleCheck,
	BgId.SquareCheck,
	BgId.FullGray,
	BgId.CircleGray,
	BgId.SquareGray,
];

/**
 * ボードプロパティパネルのProps
 */
export interface BoardPropertyPanelProps {
	/** ボードデータ */
	board: BoardData;
	/** メタデータ更新時のコールバック */
	onUpdateMeta: (updates: {
		name?: string;
		backgroundId?: BackgroundId;
	}) => void;
	/** 履歴コミット時のコールバック */
	onCommitHistory: (description: string) => void;
}

/**
 * ボードプロパティパネル
 */
export function BoardPropertyPanel({
	board,
	onUpdateMeta,
	onCommitHistory,
}: BoardPropertyPanelProps) {
	const { t } = useTranslation();

	return (
		<div className="panel h-full overflow-y-auto">
			<div className="panel-header">
				<h2 className="panel-title">{t("boardPanel.title")}</h2>
			</div>

			<div className="p-4 space-y-1">
				{/* ボード名 */}
				<PropertySection title={t("boardPanel.boardName")}>
					<Input
						type="text"
						value={board.name}
						onChange={(e) => onUpdateMeta({ name: e.target.value })}
						onBlur={() => onCommitHistory(t("boardPanel.boardNameChanged"))}
						placeholder={t("boardPanel.boardNamePlaceholder")}
					/>
				</PropertySection>

				{/* 背景 */}
				<PropertySection title={t("boardPanel.background")}>
					<Select
						value={String(board.backgroundId)}
						onValueChange={(value) => {
							onUpdateMeta({ backgroundId: Number(value) as BackgroundId });
							onCommitHistory(t("boardPanel.backgroundChanged"));
						}}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{BACKGROUND_IDS.map((id) => (
								<SelectItem key={id} value={String(id)}>
									{t(`background.${id}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</PropertySection>
			</div>
		</div>
	);
}
