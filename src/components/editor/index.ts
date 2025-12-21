/**
 * エディターコンポーネントのエクスポート
 */

export { EditorBoard } from "./EditorBoard";
export { EditorToolbar } from "./EditorToolbar";
export { LayerPanel } from "./LayerPanel";
export { ObjectPalette } from "./ObjectPalette";
export { PropertyPanel } from "./PropertyPanel";
export { BoardPropertyPanel } from "./BoardPropertyPanel";
export type { BoardPropertyPanelProps } from "./BoardPropertyPanel";
export { ObjectPropertyPanel } from "./ObjectPropertyPanel";
export type { ObjectPropertyPanelProps } from "./ObjectPropertyPanel";
export { SelectionHandles } from "./SelectionHandles";
export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";

export { ImportModal } from "./ImportModal";
export type { ImportModalProps } from "./ImportModal";

export { ExportModal } from "./ExportModal";
export type { ExportModalProps } from "./ExportModal";

// ツールバー部品
export { ToolbarButton, Divider } from "./ToolbarButton";
export type { ToolbarButtonProps } from "./ToolbarButton";

// SVGオーバーレイ
export { GridOverlay, SelectionIndicator } from "./GridOverlay";
export type { GridOverlayProps, SelectionIndicatorProps } from "./GridOverlay";

// フォーム入力コンポーネント
export {
  PropertySection,
  NumberInput,
  SliderInput,
  Checkbox,
} from "./FormInputs";
export type {
  NumberInputProps,
  SliderInputProps,
  CheckboxProps,
} from "./FormInputs";

// 型は @/lib/editor から再エクスポート（後方互換性のため）
export type { ResizeHandle, HandleType } from "@/lib/editor";
