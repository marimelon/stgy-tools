/**
 * Export modal component
 * Based on @ebay/nice-modal-react + Radix Dialog
 */

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import {
	Check,
	Copy,
	ExternalLink,
	Eye,
	Link2,
	Loader2,
	Share2,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { recalculateBoardSize, useBoard } from "@/lib/editor";
import { createShortLinkFn } from "@/lib/server/shortLinks/serverFn";
import { encodeStgy } from "@/lib/stgy";

export interface ExportModalProps {
	shortLinksEnabled?: boolean;
}
export const ExportModal = NiceModal.create(
	({ shortLinksEnabled = false }: ExportModalProps) => {
		const { t } = useTranslation();
		const modal = useModal();
		const board = useBoard();
		const codeTextareaId = useId();
		const [copied, setCopied] = useState(false);
		const [copiedShareLink, setCopiedShareLink] = useState(false);
		const [isGeneratingShortLink, setIsGeneratingShortLink] = useState(false);
		const [copiedShortLink, setCopiedShortLink] = useState(false);

		const exportedCode = useMemo(() => {
			const { width, height } = recalculateBoardSize(board);
			const exportBoard = { ...board, width, height };
			return encodeStgy(exportBoard);
		}, [board]);

		const generateShareCode = (): string => {
			const { width, height } = recalculateBoardSize(board);
			const exportBoard = { ...board, width, height };
			return encodeStgy(exportBoard);
		};

		const handleCopy = async () => {
			try {
				await navigator.clipboard.writeText(exportedCode);
			} catch {
				const textarea = document.createElement("textarea");
				textarea.value = exportedCode;
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand("copy");
				document.body.removeChild(textarea);
			}
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		};

		const handleCreateShareLink = async () => {
			try {
				const shareCode = generateShareCode();
				const shareUrl = `${window.location.origin}/?stgy=${encodeURIComponent(shareCode)}`;
				await navigator.clipboard.writeText(shareUrl);
				setCopiedShareLink(true);
				setTimeout(() => setCopiedShareLink(false), 2000);
			} catch {
				// Clipboard API not available
			}
		};

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
				// Ignore errors
			} finally {
				setIsGeneratingShortLink(false);
			}
		};

		const handleClose = () => {
			modal.hide();
		};

		return (
			<Dialog
				open={modal.visible}
				onOpenChange={(open) => {
					if (!open) handleClose();
				}}
			>
				<DialogContent
					className="sm:max-w-md"
					onOpenAutoFocus={(e) => e.preventDefault()}
					onCloseAutoFocus={() => modal.remove()}
				>
					<DialogHeader>
						<DialogTitle className="font-display">
							{t("exportModal.title")}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
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
						<Button variant="ghost" onClick={handleClose}>
							{t("exportModal.close")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	},
);
