import { KeyRound, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditKeyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (editKey: string, shouldSave: boolean) => Promise<boolean>;
}

export function EditKeyDialog({
	open,
	onOpenChange,
	onConfirm,
}: EditKeyDialogProps) {
	const { t } = useTranslation();
	const inputId = useId();
	const checkboxId = useId();
	const [editKey, setEditKey] = useState("");
	const [shouldSave, setShouldSave] = useState(true);
	const [isVerifying, setIsVerifying] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleConfirm = async () => {
		if (!editKey.trim()) return;

		setIsVerifying(true);
		setError(null);

		try {
			const success = await onConfirm(editKey.trim(), shouldSave);
			if (success) {
				handleClose();
			} else {
				setError(t("viewer.group.error.INVALID_EDIT_KEY"));
			}
		} catch {
			setError(t("viewer.group.error.STORAGE_ERROR"));
		} finally {
			setIsVerifying(false);
		}
	};

	const handleClose = () => {
		setEditKey("");
		setShouldSave(true);
		setError(null);
		onOpenChange(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && editKey.trim() && !isVerifying) {
			handleConfirm();
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<KeyRound className="size-5" />
						{t("viewer.group.enterEditKey")}
					</DialogTitle>
					<DialogDescription>
						{t("viewer.group.enterEditKeyDescription")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor={inputId}>{t("viewer.group.editKey")}</Label>
						<Input
							id={inputId}
							type="password"
							value={editKey}
							onChange={(e) => setEditKey(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="••••••••••••••••"
							className="font-mono"
							autoFocus
						/>
					</div>

					<div className="flex items-start gap-2">
						<Checkbox
							id={checkboxId}
							checked={shouldSave}
							onCheckedChange={(checked) => setShouldSave(checked === true)}
						/>
						<div className="grid gap-1 leading-none">
							<Label htmlFor={checkboxId} className="cursor-pointer">
								{t("viewer.group.saveEditKey")}
							</Label>
							<p className="text-xs text-muted-foreground">
								{t("viewer.group.saveEditKeyDescription")}
							</p>
						</div>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose}>
						{t("common.cancel")}
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={!editKey.trim() || isVerifying}
					>
						{isVerifying && <Loader2 className="size-4 animate-spin mr-2" />}
						{t("common.confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
