/**
 * インポートモーダルコンポーネント
 * @ebay/nice-modal-react + ModalBase ベース
 */

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { AlertCircle, Download } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModalBase } from "@/lib/modal";
import type { BoardData } from "@/lib/stgy";
import {
	assignBoardObjectIdsDeterministic,
	decodeStgy,
	extractKeyFromStgy,
	parseBoardData,
} from "@/lib/stgy";

/**
 * インポート結果
 */
export interface ImportResult {
	board: BoardData;
	key: number;
	stgyCode: string;
}

/**
 * インポートモーダル
 *
 * 成功時は `modal.resolve({ board, key })` で結果を返す
 * キャンセル時は `modal.resolve(undefined)` で閉じる
 */
export const ImportModal = NiceModal.create(() => {
	const { t } = useTranslation();
	const modal = useModal();
	const textareaId = useId();

	const [importText, setImportText] = useState("");
	const [importError, setImportError] = useState<string | null>(null);

	const handleImport = () => {
		try {
			setImportError(null);
			const trimmedText = importText.trim();
			const key = extractKeyFromStgy(trimmedText);
			const binary = decodeStgy(trimmedText);
			const parsed = parseBoardData(binary);
			const board = assignBoardObjectIdsDeterministic(parsed);

			modal.resolve({
				board,
				key,
				stgyCode: trimmedText,
			} satisfies ImportResult);
			modal.hide();
		} catch (e) {
			const errorMessage =
				e instanceof Error ? e.message : t("importModal.error");
			setImportError(errorMessage);
		}
	};

	const handleClose = () => {
		modal.resolve(undefined);
	};

	return (
		<ModalBase
			title={t("importModal.title")}
			onClose={handleClose}
			footer={
				<>
					<Button variant="ghost" onClick={handleClose}>
						{t("importModal.cancel")}
					</Button>
					<Button onClick={handleImport} disabled={!importText.trim()}>
						<Download className="size-4" />
						{t("importModal.import")}
					</Button>
				</>
			}
		>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor={textareaId}>{t("importModal.pasteCode")}</Label>
					<Textarea
						id={textareaId}
						value={importText}
						onChange={(e) => setImportText(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey && importText.trim()) {
								e.preventDefault();
								handleImport();
							}
						}}
						placeholder={t("importModal.placeholder")}
						className="h-32 font-mono text-sm resize-none break-all"
					/>
				</div>

				{importError && (
					<div className="flex items-center gap-2 text-sm px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-4" />
						{importError}
					</div>
				)}
			</div>
		</ModalBase>
	);
});
