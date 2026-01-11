/**
 * Save asset modal component
 * Based on @ebay/nice-modal-react + ModalBase
 *
 * Modal for saving selected objects as an asset
 */

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ObjectRenderer } from "@/components/board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	calculateAssetBounds,
	calculatePreviewViewBox,
	useAssets,
} from "@/lib/assets";
import { useObjects, useSelectedIds } from "@/lib/editor";
import { ModalBase } from "@/lib/modal";

/**
 * Save asset modal
 */
export const SaveAssetModal = NiceModal.create(() => {
	const { t } = useTranslation();
	const modal = useModal();
	const objects = useObjects();
	const selectedIds = useSelectedIds();
	const { createAsset } = useAssets();
	const nameInputId = useId();

	const [name, setName] = useState("");

	const selectedIdsSet = new Set(selectedIds);
	const selectedObjects = objects.filter((obj) => selectedIdsSet.has(obj.id));

	const bounds = calculateAssetBounds(selectedObjects);
	const viewBox = calculatePreviewViewBox(bounds, 20);

	const handleSave = () => {
		if (!name.trim()) return;
		if (selectedObjects.length === 0) return;

		createAsset(name.trim(), selectedObjects);
		modal.hide();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && name.trim()) {
			handleSave();
		}
	};

	return (
		<ModalBase
			title={t("assetPanel.saveModal.title")}
			footer={
				<>
					<Button variant="outline" onClick={() => modal.hide()}>
						{t("assetPanel.saveModal.cancel")}
					</Button>
					<Button onClick={handleSave} disabled={!name.trim()}>
						{t("assetPanel.saveModal.save")}
					</Button>
				</>
			}
		>
			<div className="space-y-4">
				{/* Preview */}
				<div>
					<Label className="text-sm font-medium mb-2 block">
						{t("assetPanel.saveModal.preview")}
					</Label>
					<div
						className="w-full h-32 bg-muted rounded-md overflow-hidden"
						style={{ background: "var(--color-bg-deep)" }}
					>
						<svg
							width="100%"
							height="100%"
							viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
							preserveAspectRatio="xMidYMid meet"
							role="img"
							aria-label={t("assetPanel.saveModal.preview")}
						>
							{[...selectedObjects].reverse().map((obj) => (
								<ObjectRenderer key={obj.id} object={obj} selected={false} />
							))}
						</svg>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						{t("assetPanel.objectCount", { count: selectedObjects.length })}
					</p>
				</div>

				{/* Asset name input */}
				<div>
					<Label
						htmlFor={nameInputId}
						className="text-sm font-medium mb-2 block"
					>
						{t("assetPanel.saveModal.name")}
					</Label>
					<Input
						id={nameInputId}
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={t("assetPanel.saveModal.namePlaceholder")}
						autoFocus
					/>
				</div>
			</div>
		</ModalBase>
	);
});
