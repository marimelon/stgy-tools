/**
 * モーダルコンポーネント
 *
 * shadcn/ui Dialog をベースにした汎用モーダル
 */

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * モーダルコンポーネントのProps
 */
export interface ModalProps {
  /** モーダルのタイトル */
  title: string;
  /** モーダルの内容 */
  children: ReactNode;
  /** 閉じるときのコールバック */
  onClose: () => void;
  /** 開閉状態 */
  open?: boolean;
}

/**
 * モーダルコンポーネント
 */
export function Modal({ children, onClose, title, open = true }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
