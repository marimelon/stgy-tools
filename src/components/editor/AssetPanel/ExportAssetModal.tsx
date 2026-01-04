/**
 * アセットエクスポートモーダルコンポーネント
 * @ebay/nice-modal-react + ModalBase ベース
 *
 * アセットをstgyコードとしてエクスポートするためのモーダル
 */

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type AssetWithRuntimeIds, assetToBoardData } from "@/lib/assets";
import { ModalBase } from "@/lib/modal";
import { encodeStgy } from "@/lib/stgy";

export interface ExportAssetModalProps {
	/** エクスポート対象のアセット */
	asset: AssetWithRuntimeIds;
}

/**
 * アセットエクスポートモーダル
 */
export const ExportAssetModal = NiceModal.create(
	({ asset }: ExportAssetModalProps) => {
		const { t } = useTranslation();
		const modal = useModal();
		const [copied, setCopied] = useState(false);

		// アセットをstgyコードにエンコード（キー固定で一貫性を確保）
		const stgyCode = useMemo(() => {
			const boardData = assetToBoardData(asset);
			return encodeStgy(boardData);
		}, [asset]);

		const handleCopy = async () => {
			try {
				await navigator.clipboard.writeText(stgyCode);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} catch {
				console.error("Failed to copy to clipboard");
			}
		};

		return (
			<ModalBase
				title={t("assetPanel.exportModal.title")}
				footer={
					<>
						<Button variant="outline" onClick={() => modal.hide()}>
							{t("assetPanel.saveModal.cancel")}
						</Button>
						<Button onClick={handleCopy} className="min-w-[100px]">
							{copied ? (
								<>
									<Check size={16} className="mr-1" />
									{t("assetPanel.exportModal.copied")}
								</>
							) : (
								<>
									<Copy size={16} className="mr-1" />
									{t("assetPanel.exportModal.copy")}
								</>
							)}
						</Button>
					</>
				}
			>
				<div className="space-y-4">
					{/* アセット名 */}
					<div>
						<Label className="text-sm font-medium mb-1 block">
							{t("assetPanel.saveModal.name")}
						</Label>
						<p className="text-sm text-foreground">{asset.name}</p>
					</div>

					{/* stgyコード */}
					<div>
						<Label className="text-sm font-medium mb-2 block">
							{t("assetPanel.exportModal.stgyCode")}
						</Label>
						<textarea
							value={stgyCode}
							readOnly
							className="w-full h-24 p-2 text-xs font-mono bg-muted border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
							onClick={(e) => e.currentTarget.select()}
						/>
						<p className="text-xs text-muted-foreground mt-1">
							{t("assetPanel.objectCount", { count: asset.objects.length })}
						</p>
					</div>
				</div>
			</ModalBase>
		);
	},
);
