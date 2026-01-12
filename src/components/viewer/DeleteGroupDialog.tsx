import { Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface DeleteGroupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	groupName: string;
	isDeleting: boolean;
	/** Error message to display */
	error?: string | null;
	onConfirm: () => void;
}

export function DeleteGroupDialog({
	open,
	onOpenChange,
	groupName,
	isDeleting,
	error,
	onConfirm,
}: DeleteGroupDialogProps) {
	const { t } = useTranslation();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Trash2 className="size-5 text-destructive" />
						{t("viewer.group.deleteTitle")}
					</DialogTitle>
					<DialogDescription>
						{t("viewer.group.deleteDescription", { name: groupName })}
					</DialogDescription>
				</DialogHeader>
				{error && <p className="text-sm text-destructive">{error}</p>}
				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						{t("common.cancel")}
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isDeleting}
					>
						{isDeleting ? (
							<Loader2 className="size-4 animate-spin mr-1" />
						) : (
							<Trash2 className="size-4 mr-1" />
						)}
						{t("viewer.group.deleteConfirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
