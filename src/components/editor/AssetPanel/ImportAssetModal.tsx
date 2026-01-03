/**
 * アセットインポートモーダルコンポーネント
 *
 * stgyコードからアセットをインポートするためのモーダル
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ObjectRenderer } from "@/components/board";
import { Modal } from "@/components/editor/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	boardDataToAssetData,
	calculatePreviewViewBox,
	useAssets,
} from "@/lib/assets";
import { assignBoardObjectIds, decodeStgy, parseBoardData } from "@/lib/stgy";

interface ImportAssetModalProps {
	/** 閉じるときのコールバック */
	onClose: () => void;
}

interface ParseResult {
	success: true;
	objects: ReturnType<typeof boardDataToAssetData>["objects"];
	bounds: ReturnType<typeof boardDataToAssetData>["bounds"];
	boardName: string;
}

interface ParseError {
	success: false;
	error: "invalidStgy" | "noObjects";
}

type ParseState = ParseResult | ParseError | null;

/**
 * アセットインポートモーダル
 */
export function ImportAssetModal({ onClose }: ImportAssetModalProps) {
	const { t } = useTranslation();
	const { createAsset } = useAssets();
	const nameInputId = useId();
	const stgyInputId = useId();

	const [name, setName] = useState("");
	const [stgyCode, setStgyCode] = useState("");

	// ユーザーが名前を手動で編集したかを追跡
	const hasUserEditedName = useRef(false);

	// stgyコードをパースして結果を取得
	const parseResult: ParseState = useMemo(() => {
		if (!stgyCode.trim()) {
			return null;
		}

		try {
			const decoded = decodeStgy(stgyCode.trim());
			const parsed = parseBoardData(decoded);
			const boardData = assignBoardObjectIds(parsed);
			const assetData = boardDataToAssetData(boardData);

			if (assetData.objects.length === 0) {
				return { success: false, error: "noObjects" };
			}

			return {
				success: true,
				objects: assetData.objects,
				bounds: assetData.bounds,
				boardName: boardData.name,
			};
		} catch {
			return { success: false, error: "invalidStgy" };
		}
	}, [stgyCode]);

	// stgyコードからボード名を自動入力（名前が未入力かつユーザーが編集していない場合）
	useEffect(() => {
		if (
			parseResult?.success &&
			parseResult.boardName &&
			!hasUserEditedName.current
		) {
			setName(parseResult.boardName);
		}
	}, [parseResult]);

	// プレビュー用のviewBoxを計算
	const viewBox = useMemo(() => {
		if (!parseResult || !parseResult.success) {
			return { x: 0, y: 0, width: 100, height: 100 };
		}
		return calculatePreviewViewBox(parseResult.bounds, 20);
	}, [parseResult]);

	const canImport =
		name.trim() !== "" && parseResult !== null && parseResult.success;

	const handleImport = () => {
		if (!canImport || !parseResult || !parseResult.success) return;

		createAsset(name.trim(), parseResult.objects);
		onClose();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && canImport) {
			handleImport();
		}
	};

	return (
		<Modal title={t("assetPanel.importModal.title")} onClose={onClose}>
			<div className="space-y-4">
				{/* アセット名入力 */}
				<div>
					<Label
						htmlFor={nameInputId}
						className="text-sm font-medium mb-2 block"
					>
						{t("assetPanel.importModal.assetName")}
					</Label>
					<Input
						id={nameInputId}
						type="text"
						value={name}
						onChange={(e) => {
							setName(e.target.value);
							hasUserEditedName.current = true;
						}}
						onKeyDown={handleKeyDown}
						placeholder={t("assetPanel.saveModal.namePlaceholder")}
						autoFocus
					/>
					{!name.trim() && stgyCode.trim() && (
						<p className="text-xs text-destructive mt-1">
							{t("assetPanel.importModal.errors.nameRequired")}
						</p>
					)}
				</div>

				{/* stgyコード入力 */}
				<div>
					<Label
						htmlFor={stgyInputId}
						className="text-sm font-medium mb-2 block"
					>
						{t("assetPanel.importModal.stgyCode")}
					</Label>
					<textarea
						id={stgyInputId}
						value={stgyCode}
						onChange={(e) => setStgyCode(e.target.value)}
						placeholder={t("assetPanel.importModal.stgyCodePlaceholder")}
						className="w-full h-24 p-2 text-xs font-mono bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
					/>
					{parseResult && !parseResult.success && (
						<p className="text-xs text-destructive mt-1">
							{t(`assetPanel.importModal.errors.${parseResult.error}`)}
						</p>
					)}
				</div>

				{/* プレビュー */}
				<div>
					<Label className="text-sm font-medium mb-2 block">
						{t("assetPanel.importModal.preview")}
					</Label>
					<div
						className="w-full h-32 bg-muted rounded-md overflow-hidden"
						style={{ background: "var(--color-bg-deep)" }}
					>
						{parseResult?.success ? (
							<svg
								width="100%"
								height="100%"
								viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
								preserveAspectRatio="xMidYMid meet"
								role="img"
								aria-label={t("assetPanel.importModal.preview")}
							>
								{/* SVGは後から描画したものが上に表示されるため、逆順で描画 */}
								{[...parseResult.objects].reverse().map((obj) => (
									<ObjectRenderer key={obj.id} object={obj} selected={false} />
								))}
							</svg>
						) : (
							<div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
								{stgyCode.trim()
									? t("assetPanel.importModal.errors.invalidStgy")
									: t("assetPanel.importModal.stgyCodePlaceholder")}
							</div>
						)}
					</div>
					{parseResult?.success && (
						<p className="text-xs text-muted-foreground mt-1">
							{t("assetPanel.importModal.objectCount", {
								count: parseResult.objects.length,
							})}
						</p>
					)}
				</div>

				{/* ボタン */}
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="outline" onClick={onClose}>
						{t("assetPanel.saveModal.cancel")}
					</Button>
					<Button onClick={handleImport} disabled={!canImport}>
						{t("assetPanel.importModal.import")}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
