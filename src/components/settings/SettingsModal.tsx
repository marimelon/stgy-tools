/**
 * 設定モーダルコンポーネント
 * @ebay/nice-modal-react + Radix Dialog ベース
 */

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Bug, Keyboard, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useAppSettings, useSettingsActions } from "@/lib/settings";
import { ShortcutsList } from "./ShortcutsList";

type TabId = "general" | "shortcuts";

/**
 * 設定モーダル
 */
export const SettingsModal = NiceModal.create(() => {
	const { t } = useTranslation();
	const modal = useModal();
	const settings = useAppSettings();
	const { updateSettings, resetSettings } = useSettingsActions();
	const [activeTab, setActiveTab] = useState<TabId>("general");

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
				className="sm:max-w-lg"
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={() => modal.remove()}
			>
				<DialogHeader>
					<DialogTitle className="font-display">
						{t("settings.title")}
					</DialogTitle>
				</DialogHeader>

				{/* タブボタン */}
				<div className="flex gap-1 p-1 bg-muted rounded-lg">
					<button
						type="button"
						onClick={() => setActiveTab("general")}
						className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
							activeTab === "general"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<SlidersHorizontal className="size-4" />
						{t("settings.tabs.general")}
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("shortcuts")}
						className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
							activeTab === "shortcuts"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<Keyboard className="size-4" />
						{t("settings.tabs.shortcuts")}
					</button>
				</div>

				{/* 一般設定タブ */}
				{activeTab === "general" && (
					<div className="space-y-4 mt-2">
						{/* デバッグモード */}
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label className="text-sm font-medium flex items-center gap-2">
									<Bug className="size-4 text-muted-foreground" />
									{t("settings.debugMode")}
								</Label>
								<p className="text-xs text-muted-foreground">
									{t("settings.debugModeDescription")}
								</p>
							</div>
							<Switch
								checked={settings.debugMode}
								onCheckedChange={(checked: boolean) =>
									updateSettings({ debugMode: checked })
								}
							/>
						</div>
					</div>
				)}

				{/* ショートカットタブ */}
				{activeTab === "shortcuts" && (
					<div className="mt-2">
						<ShortcutsList />
					</div>
				)}

				<DialogFooter className="flex-row justify-between sm:justify-between">
					<Button
						variant="ghost"
						size="sm"
						onClick={resetSettings}
						className="text-muted-foreground"
					>
						<RotateCcw className="size-4" />
						{t("settings.reset")}
					</Button>
					<Button variant="default" onClick={handleClose}>
						{t("common.close")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});
