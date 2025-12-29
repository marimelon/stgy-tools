/**
 * アセット保存モーダルコンポーネント
 *
 * 選択されたオブジェクトをアセットとして保存するためのモーダル
 */

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ObjectRenderer } from "@/components/board";
import { Modal } from "@/components/editor/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	calculateAssetBounds,
	calculatePreviewViewBox,
	useAssets,
} from "@/lib/assets";
import { useBoard, useSelectedIndices } from "@/lib/editor";

interface SaveAssetModalProps {
	/** 閉じるときのコールバック */
	onClose: () => void;
}

/**
 * アセット保存モーダル
 */
export function SaveAssetModal({ onClose }: SaveAssetModalProps) {
	const { t } = useTranslation();
	const board = useBoard();
	const selectedIndices = useSelectedIndices();
	const { createAsset } = useAssets();
	const nameInputId = useId();

	const [name, setName] = useState("");

	// 選択されたオブジェクトを取得
	const selectedObjects = selectedIndices
		.filter((i) => i >= 0 && i < board.objects.length)
		.map((i) => board.objects[i]);

	// プレビュー用のバウンディングボックスとviewBoxを計算
	const bounds = calculateAssetBounds(selectedObjects);
	const viewBox = calculatePreviewViewBox(bounds, 20);

	const handleSave = () => {
		if (!name.trim()) return;
		if (selectedObjects.length === 0) return;

		createAsset(name.trim(), selectedObjects);
		onClose();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && name.trim()) {
			handleSave();
		}
	};

	return (
		<Modal title={t("assetPanel.saveModal.title")} onClose={onClose}>
			<div className="space-y-4">
				{/* プレビュー */}
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
							{/* SVGは後から描画したものが上に表示されるため、逆順で描画 */}
							{[...selectedObjects].reverse().map((obj, index) => {
								const originalIndex = selectedObjects.length - 1 - index;
								const key = `preview-${obj.position.x}-${obj.position.y}-${obj.objectId}-${originalIndex}`;
								return (
									<ObjectRenderer
										key={key}
										object={obj}
										index={originalIndex}
										selected={false}
									/>
								);
							})}
						</svg>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						{t("assetPanel.objectCount", { count: selectedObjects.length })}
					</p>
				</div>

				{/* アセット名入力 */}
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

				{/* ボタン */}
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="outline" onClick={onClose}>
						{t("assetPanel.saveModal.cancel")}
					</Button>
					<Button onClick={handleSave} disabled={!name.trim()}>
						{t("assetPanel.saveModal.save")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
