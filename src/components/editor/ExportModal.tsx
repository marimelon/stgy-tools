/**
 * エクスポートモーダルコンポーネント
 * shadcn/ui Dialog ベース
 */

import { Copy, Key } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * エクスポートモーダルのProps
 */
export interface ExportModalProps {
	/** エクスポートされたコード */
	exportedCode: string;
	/** エンコードキー */
	encodeKey: number | null;
	/** エンコードキー変更時のコールバック */
	onEncodeKeyChange: (key: number | null) => void;
	/** コピー時のコールバック */
	onCopy: () => void;
	/** 閉じる時のコールバック */
	onClose: () => void;
}

/**
 * エクスポートモーダル
 */
export function ExportModal({
	exportedCode,
	encodeKey,
	onEncodeKeyChange,
	onCopy,
	onClose,
}: ExportModalProps) {
	const keyInputId = useId();
	const codeTextareaId = useId();

	const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		if (val === "") {
			onEncodeKeyChange(null);
		} else {
			const num = Number.parseInt(val, 10);
			if (!Number.isNaN(num)) {
				onEncodeKeyChange(Math.max(0, Math.min(63, num)));
			}
		}
	};

	return (
		<Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="font-display">エクスポート</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={keyInputId} className="flex items-center gap-2">
							<Key className="size-4 text-primary" />
							暗号化キー (0-63):
						</Label>
						<div className="flex items-center gap-3">
							<Input
								id={keyInputId}
								type="number"
								min={0}
								max={63}
								value={encodeKey ?? ""}
								onChange={handleKeyChange}
								placeholder="ランダム"
								className="w-24 font-mono"
							/>
							<span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
								{encodeKey !== null ? (
									<>
										キー <span className="text-primary">{encodeKey}</span>{" "}
										を使用
									</>
								) : (
									"ランダムキーを使用"
								)}
							</span>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor={codeTextareaId}>生成されたstgyコード:</Label>
						<Textarea
							id={codeTextareaId}
							value={exportedCode}
							readOnly
							className="h-32 font-mono text-sm resize-none"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="ghost" onClick={onClose}>
						閉じる
					</Button>
					<Button onClick={onCopy}>
						<Copy className="size-4" />
						コピー
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
