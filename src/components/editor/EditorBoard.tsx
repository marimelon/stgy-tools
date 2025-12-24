/**
 * エディターボードコンポーネント
 *
 * BoardViewerを拡張し、ドラッグ/回転/リサイズのインタラクションを追加
 */

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	BackgroundRenderer,
	getObjectBoundingBox,
	ObjectRenderer,
} from "@/components/board";
import {
	type EditorBoardProps,
	useCanvasInteraction,
	useEditor,
} from "@/lib/editor";
import { ObjectIds } from "@/lib/stgy";
import { ContextMenu, type ContextMenuState } from "./ContextMenu";
import { GridOverlay, SelectionIndicator } from "./GridOverlay";
import { InlineTextEditor } from "./InlineTextEditor";
import { LineSelectionHandles } from "./LineSelectionHandles";
import { SelectionHandles } from "./SelectionHandles";

/** キャンバスサイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

/**
 * エディターボードコンポーネント
 */
export function EditorBoard({ scale = 1 }: EditorBoardProps) {
	const { t } = useTranslation();
	const {
		state,
		selectObject,
		selectObjects,
		deselectAll,
		updateObject,
		commitHistory,
		addObject,
		getGroupForObject,
		selectGroup,
		moveObjects,
		copySelected,
		paste,
		duplicateSelected,
		deleteSelected,
		groupSelected,
		ungroup,
		moveLayer,
		selectAll,
		canGroup,
		selectedGroup,
		startTextEdit,
		endTextEdit,
	} = useEditor();

	const { board, selectedIndices, gridSettings, clipboard, editingTextIndex } =
		state;
	const { backgroundId, objects } = board;

	const svgRef = useRef<SVGSVGElement>(null);

	// コンテキストメニュー状態
	const [contextMenu, setContextMenu] = useState<ContextMenuState>({
		isOpen: false,
		x: 0,
		y: 0,
		targetIndex: null,
	});

	const closeContextMenu = useCallback(() => {
		setContextMenu((prev) => ({ ...prev, isOpen: false }));
	}, []);

	// オブジェクトダブルクリック（テキスト編集開始）
	const handleObjectDoubleClick = useCallback(
		(index: number, e: React.MouseEvent) => {
			e.stopPropagation();
			const obj = objects[index];
			if (obj?.objectId === ObjectIds.Text && !obj.flags.locked) {
				startTextEdit(index);
			}
		},
		[objects, startTextEdit],
	);

	// 背景での右クリック
	const handleBackgroundContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setContextMenu({
			isOpen: true,
			x: e.clientX,
			y: e.clientY,
			targetIndex: null,
		});
	}, []);

	// オブジェクト上での右クリック
	const handleObjectContextMenu = useCallback(
		(index: number, e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			// 未選択のオブジェクトを右クリックした場合は選択する
			if (!selectedIndices.includes(index)) {
				selectObject(index);
			}

			setContextMenu({
				isOpen: true,
				x: e.clientX,
				y: e.clientY,
				targetIndex: index,
			});
		},
		[selectedIndices, selectObject],
	);

	// インタラクションフック
	const {
		marqueeState,
		handleBackgroundClick,
		handleBackgroundPointerDown,
		handleDragOver,
		handleDrop,
		handleObjectClick,
		handleObjectPointerDown,
		handleRotateStart,
		handleResizeStart,
		handlePointerMove,
		handlePointerUp,
	} = useCanvasInteraction({
		svgRef,
		objects,
		selectedIndices,
		gridSettings,
		selectObject,
		selectObjects,
		selectGroup,
		getGroupForObject,
		updateObject,
		moveObjects,
		commitHistory,
		addObject,
		deselectAll,
	});

	// 可視オブジェクトのみ取得
	const visibleObjects = objects
		.map((obj, index) => ({ obj, index }))
		.filter(({ obj }) => obj.flags.visible);

	// 選択オブジェクトの取得
	const selectedObject =
		selectedIndices.length === 1 ? objects[selectedIndices[0]] : null;

	// マーキー矩形の計算
	const marqueeRect = marqueeState
		? {
				x: Math.min(marqueeState.startPoint.x, marqueeState.currentPoint.x),
				y: Math.min(marqueeState.startPoint.y, marqueeState.currentPoint.y),
				width: Math.abs(
					marqueeState.currentPoint.x - marqueeState.startPoint.x,
				),
				height: Math.abs(
					marqueeState.currentPoint.y - marqueeState.startPoint.y,
				),
			}
		: null;

	return (
		<>
			<svg
				ref={svgRef}
				width={CANVAS_WIDTH * scale}
				height={CANVAS_HEIGHT * scale}
				viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
				onClick={handleBackgroundClick}
				onKeyDown={(e) => e.key === "Escape" && deselectAll()}
				onPointerDown={handleBackgroundPointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onContextMenu={handleBackgroundContextMenu}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				className="bg-slate-800"
				role="application"
				aria-label="Strategy Board Editor"
			>
				{/* 背景 */}
				<BackgroundRenderer
					backgroundId={backgroundId}
					width={CANVAS_WIDTH}
					height={CANVAS_HEIGHT}
				/>

				{/* グリッド線 */}
				{gridSettings.enabled && gridSettings.showGrid && (
					<GridOverlay
						width={CANVAS_WIDTH}
						height={CANVAS_HEIGHT}
						gridSize={gridSettings.size}
					/>
				)}

				{/* オブジェクト (逆順で描画してレイヤー順を正しくする) */}
				{[...visibleObjects].reverse().map(({ obj, index }) => (
					// biome-ignore lint/a11y/noStaticElementInteractions: SVG group elements require onClick for selection
					<g
						key={index}
						onClick={(e) => handleObjectClick(index, e)}
						onDoubleClick={(e) => handleObjectDoubleClick(index, e)}
						onPointerDown={(e) => handleObjectPointerDown(index, e)}
						onContextMenu={(e) => handleObjectContextMenu(index, e)}
						style={{
							cursor: "move",
							opacity: editingTextIndex === index ? 0.3 : 1,
						}}
					>
						<ObjectRenderer
							object={obj}
							index={index}
							showBoundingBox={false}
							selected={false}
						/>
					</g>
				))}

				{/* 選択インジケーター (複数選択時のみ) */}
				{selectedIndices.length > 1 &&
					selectedIndices.map((index) => {
						const obj = objects[index];
						if (!obj) return null;
						const size = 48 * (obj.size / 100);
						return (
							<SelectionIndicator
								key={`selection-${index}`}
								x={obj.position.x}
								y={obj.position.y}
								width={size}
								height={size}
								rotation={obj.rotation}
							/>
						);
					})}

				{/* インラインテキストエディタ */}
				{editingTextIndex !== null && objects[editingTextIndex] && (
					<InlineTextEditor
						object={objects[editingTextIndex]}
						onEndEdit={endTextEdit}
					/>
				)}

				{/* 選択ハンドル (単一選択時のみ、テキスト編集中は非表示) */}
				{selectedObject &&
					selectedIndices.length === 1 &&
					editingTextIndex === null &&
					(() => {
						const selectedIndex = selectedIndices[0];

						// Lineの場合は専用ハンドルを表示
						if (selectedObject.objectId === ObjectIds.Line) {
							const startX = selectedObject.position.x;
							const startY = selectedObject.position.y;
							const endX = (selectedObject.param1 ?? startX * 10 + 2560) / 10;
							const endY = (selectedObject.param2 ?? startY * 10) / 10;

							return (
								<LineSelectionHandles
									startX={startX}
									startY={startY}
									endX={endX}
									endY={endY}
									onStartPointDrag={(x, y) => {
										// 始点移動：positionを更新
										updateObject(selectedIndex, {
											position: { x, y },
										});
									}}
									onStartPointDragEnd={() => {
										commitHistory(t("toolbar.lineStartMoved"));
									}}
									onEndPointDrag={(x, y) => {
										// 終点移動：param1, param2を更新、角度も再計算
										const dx = x - selectedObject.position.x;
										const dy = y - selectedObject.position.y;
										const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
										updateObject(selectedIndex, {
											param1: Math.round(x * 10),
											param2: Math.round(y * 10),
											rotation: Math.round(angle),
										});
									}}
									onEndPointDragEnd={() => {
										commitHistory(t("toolbar.lineEndMoved"));
									}}
								/>
							);
						}

						// 通常オブジェクトのハンドル
						const bbox = getObjectBoundingBox(
							selectedObject.objectId,
							selectedObject.param1,
							selectedObject.param2,
							selectedObject.param3,
							selectedObject.text,
							selectedObject.position,
						);
						const objScale = selectedObject.size / 100;
						return (
							<SelectionHandles
								x={selectedObject.position.x}
								y={selectedObject.position.y}
								width={bbox.width * objScale}
								height={bbox.height * objScale}
								offsetX={(bbox.offsetX ?? 0) * objScale}
								offsetY={(bbox.offsetY ?? 0) * objScale}
								rotation={selectedObject.rotation}
								onRotateStart={handleRotateStart}
								onResizeStart={handleResizeStart}
							/>
						);
					})()}

				{/* マーキー選択矩形 */}
				{marqueeRect && (
					<rect
						x={marqueeRect.x}
						y={marqueeRect.y}
						width={marqueeRect.width}
						height={marqueeRect.height}
						fill="rgba(34, 211, 238, 0.1)"
						stroke="#22d3ee"
						strokeWidth={1}
						strokeDasharray="4 2"
						pointerEvents="none"
					/>
				)}
			</svg>

			{/* コンテキストメニュー */}
			<ContextMenu
				menuState={contextMenu}
				onClose={closeContextMenu}
				selectedIndices={selectedIndices}
				hasClipboard={clipboard !== null}
				canGroup={canGroup}
				selectedGroup={selectedGroup}
				actions={{
					copy: copySelected,
					paste: () => paste(),
					duplicate: duplicateSelected,
					delete: deleteSelected,
					group: groupSelected,
					ungroup: () => selectedGroup && ungroup(selectedGroup.id),
					moveLayer,
					selectAll,
				}}
			/>
		</>
	);
}
