/**
 * Base modal component for nice-modal + Radix Dialog integration
 *
 * Usage:
 * ```tsx
 * const MyModal = NiceModal.create(({ name }: { name: string }) => {
 *   const modal = useModal();
 *   return (
 *     <ModalBase title="My Modal">
 *       <p>Hello, {name}!</p>
 *       <Button onClick={() => modal.resolve("result")}>OK</Button>
 *     </ModalBase>
 *   );
 * });
 *
 * // Show modal from anywhere
 * const result = await NiceModal.show(MyModal, { name: "World" });
 * ```
 */

import { useModal } from "@ebay/nice-modal-react";
import type { ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export interface ModalBaseProps {
	/** Modal title */
	title: string;
	/** Modal content */
	children: ReactNode;
	/** Optional description for accessibility */
	description?: string;
	/** Optional footer content */
	footer?: ReactNode;
	/** Max width class (default: "sm:max-w-md") */
	maxWidth?: string;
	/** Prevent auto focus on open */
	preventAutoFocus?: boolean;
	/** Custom close handler (called before modal.hide()) */
	onClose?: () => void;
}

/**
 * Base modal component that integrates nice-modal with Radix Dialog
 *
 * Must be used inside a NiceModal.create() wrapped component
 */
export function ModalBase({
	title,
	children,
	description,
	footer,
	maxWidth = "sm:max-w-md",
	preventAutoFocus = false,
	onClose,
}: ModalBaseProps) {
	const modal = useModal();

	const handleClose = () => {
		onClose?.();
		modal.hide();
	};

	return (
		<Dialog
			open={modal.visible}
			onOpenChange={(open) => {
				if (!open) {
					handleClose();
				}
			}}
		>
			<DialogContent
				className={maxWidth}
				onOpenAutoFocus={
					preventAutoFocus ? (e) => e.preventDefault() : undefined
				}
				onCloseAutoFocus={() => modal.remove()}
			>
				<DialogHeader>
					<DialogTitle className="font-display">{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				{children}
				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</Dialog>
	);
}
