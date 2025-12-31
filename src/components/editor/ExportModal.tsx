/**
 * エクスポートモーダルコンポーネント
 * shadcn/ui Dialog ベース
 */

import {
	Check,
	Copy,
	ExternalLink,
	Eye,
	Key,
	Link2,
	Loader2,
	Share2,
} from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { recalculateBoardSize, useBoard } from "@/lib/editor";
import { createShortLinkFn } from "@/lib/server/shortLinks/serverFn";
import { useDebugMode } from "@/lib/settings";
import { encodeStgy } from "@/lib/stgy";

/** 共有リンク用の固定キー */
const SHARE_LINK_KEY = 61;

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
	/** 短縮リンク機能が有効かどうか */
	shortLinksEnabled?: boolean;
}

/**
 * エクスポートモーダル
 *
 * 共有リンク生成時のみboardを使用するため、モーダル内でuseBoard()を呼び出し
 */
export function ExportModal({
	exportedCode,
	encodeKey,
	onEncodeKeyChange,
	onCopy,
	onClose,
	shortLinksEnabled = false,
}: ExportModalProps) {
	const { t } = useTranslation();
	const { debugMode } = useDebugMode();
	const board = useBoard(); // 共有リンク生成時のみ使用
	const keyInputId = useId();
	const codeTextareaId = useId();
	const [copied, setCopied] = useState(false);
	const [copiedShareLink, setCopiedShareLink] = useState(false);
	const [isGeneratingShortLink, setIsGeneratingShortLink] = useState(false);
	const [copiedShortLink, setCopiedShortLink] = useState(false);

	// 共有リンク用のstgyコードを生成（固定キー使用）
	const generateShareCode = (): string => {
		const { width, height } = recalculateBoardSize(board);
		const exportBoard = { ...board, width, height };
		return encodeStgy(exportBoard, { key: SHARE_LINK_KEY });
	};

	const handleCopy = () => {
		onCopy();
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

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

	// 直接共有リンクをコピー（固定キー使用）
	const handleCreateShareLink = async () => {
		try {
			const shareCode = generateShareCode();
			const shareUrl = `${window.location.origin}/?stgy=${encodeURIComponent(shareCode)}`;
			await navigator.clipboard.writeText(shareUrl);
			setCopiedShareLink(true);
			setTimeout(() => setCopiedShareLink(false), 2000);
		} catch {
			// クリップボードAPIが利用できない場合は何もしない
		}
	};

	// 短縮リンクを作成（固定キー使用）
	const handleCreateShortLink = async () => {
		setIsGeneratingShortLink(true);
		setCopiedShortLink(false);
		try {
			const shareCode = generateShareCode();
			const result = await createShortLinkFn({
				data: { stgy: shareCode, baseUrl: window.location.origin },
			});
			if (result.success && result.data.url) {
				await navigator.clipboard.writeText(result.data.url);
				setCopiedShortLink(true);
				setTimeout(() => setCopiedShortLink(false), 2000);
			}
		} catch {
			// エラー時は何もしない
		} finally {
			setIsGeneratingShortLink(false);
		}
	};

	return (
		<Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent
				className="sm:max-w-md"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle className="font-display">
						{t("exportModal.title")}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{debugMode && (
						<div className="space-y-2">
							<Label htmlFor={keyInputId} className="flex items-center gap-2">
								<Key className="size-4 text-primary" />
								{t("exportModal.encryptionKey")}
							</Label>
							<div className="flex items-center gap-3">
								<Input
									id={keyInputId}
									type="number"
									min={0}
									max={63}
									value={encodeKey ?? ""}
									onChange={handleKeyChange}
									placeholder={t("exportModal.randomPlaceholder")}
									className="w-24 font-mono"
								/>
								<span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
									{encodeKey !== null ? (
										<>
											{t("exportModal.usingKey")}{" "}
											<span className="text-primary">{encodeKey}</span>{" "}
											{t("exportModal.useKey")}
										</>
									) : (
										t("exportModal.usingRandomKey")
									)}
								</span>
							</div>
						</div>
					)}

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor={codeTextareaId}>
								{t("exportModal.generatedCode")}
							</Label>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCopy}
								className="h-7 px-2"
							>
								{copied ? (
									<>
										<Check className="size-3.5" />
										{t("exportModal.copied")}
									</>
								) : (
									<>
										<Copy className="size-3.5" />
										{t("exportModal.copy")}
									</>
								)}
							</Button>
						</div>
						<Textarea
							id={codeTextareaId}
							value={exportedCode}
							readOnly
							className="h-32 font-mono text-sm resize-none break-all"
						/>
					</div>

					<Separator />

					{/* 共有リンクセクション */}
					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							<Share2 className="size-4 text-primary" />
							{t("exportModal.shareSection")}
						</Label>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={handleCreateShareLink}
								disabled={!exportedCode}
								className="flex-1 justify-start"
							>
								{copiedShareLink ? (
									<>
										<Check className="size-4" />
										{t("exportModal.shareLinkCopied")}
									</>
								) : (
									<>
										<Link2 className="size-4" />
										{t("exportModal.createShareLink")}
									</>
								)}
							</Button>
							{shortLinksEnabled && (
								<Button
									variant="ghost"
									onClick={handleCreateShortLink}
									disabled={!exportedCode || isGeneratingShortLink}
								>
									{isGeneratingShortLink ? (
										<>
											<Loader2 className="size-4 animate-spin" />
											{t("exportModal.generatingShortLink")}
										</>
									) : copiedShortLink ? (
										<>
											<Check className="size-4" />
											{t("exportModal.shortLinkCopied")}
										</>
									) : (
										<>
											<Share2 className="size-4" />
											{t("exportModal.createShortLink")}
										</>
									)}
								</Button>
							)}
						</div>
					</div>
				</div>

				<DialogFooter className="flex-col sm:flex-row gap-2">
					<div className="flex gap-2 sm:mr-auto">
						<Button
							variant="outline"
							onClick={() => {
								const shareCode = generateShareCode();
								const url = `/?stgy=${encodeURIComponent(shareCode)}`;
								window.open(url, "_blank");
							}}
							disabled={!exportedCode}
						>
							<Eye className="size-4" />
							{t("exportModal.openViewer")}
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								const url = `/image/generate?stgy=${encodeURIComponent(exportedCode)}`;
								window.open(url, "_blank");
							}}
							disabled={!exportedCode}
						>
							<ExternalLink className="size-4" />
							{t("exportModal.openImageGenerator")}
						</Button>
					</div>
					<Button variant="ghost" onClick={onClose}>
						{t("exportModal.close")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
