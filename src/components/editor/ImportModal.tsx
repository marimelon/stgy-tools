/**
 * インポートモーダルコンポーネント
 * shadcn/ui Dialog ベース
 */

import { AlertCircle, Download } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * インポートモーダルのProps
 */
export interface ImportModalProps {
	/** インポートテキスト */
	importText: string;
	/** インポートテキスト変更時のコールバック */
	onImportTextChange: (text: string) => void;
	/** インポートエラー */
	importError: string | null;
	/** インポート実行時のコールバック */
	onImport: () => void;
	/** 閉じる時のコールバック */
	onClose: () => void;
}

/**
 * インポートモーダル
 */
export function ImportModal({
	importText,
	onImportTextChange,
	importError,
	onImport,
	onClose,
}: ImportModalProps) {
	const textareaId = useId();

	return (
		<Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-display">インポート</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={textareaId}>stgyコードを貼り付け:</Label>
						<Textarea
							id={textareaId}
							value={importText}
							onChange={(e) => onImportTextChange(e.target.value)}
							placeholder="[stgy:a...]"
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

				<DialogFooter>
					<Button variant="ghost" onClick={onClose}>
						キャンセル
					</Button>
					<Button onClick={onImport} disabled={!importText.trim()}>
						<Download className="size-4" />
						インポート
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
