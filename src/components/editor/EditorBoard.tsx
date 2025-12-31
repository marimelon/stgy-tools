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
	CANVAS_COLORS,
	type EditorBoardProps,
	useBoard,
	useCanGroup,
	useCanvasInteraction,
	useCircularMode,
	useClipboard,
	useEditingTextIndex,
	useEditorActions,
	useFocusedGroup,
	useFocusedGroupId,
	useGridSettings,
	useGroups,
	useIsCircularMode,
	useIsFocusMode,
	useLongPress,
	useSelectedGroup,
	useSelectedIndices,
} from "@/lib/editor";
import type { ObjectGroup } from "@/lib/editor/types";
import { ObjectIds } from "@/lib/stgy";
import { CircularGuideOverlay } from "./CircularGuideOverlay";
import { CircularHandles } from "./CircularHandles";
import { CircularModeIndicator } from "./CircularModeIndicator";
import { ContextMenu, type ContextMenuState } from "./ContextMenu";
import { EditorGridOverlay } from "./EditorGridOverlay";
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

	// State
	const board = useBoard();
	const selectedIndices = useSelectedIndices();
	const gridSettings = useGridSettings();
	const clipboard = useClipboard();
	const editingTextIndex = useEditingTextIndex();
	const focusedGroupId = useFocusedGroupId();
	const groups = useGroups();

	// Derived state
	const canGroup = useCanGroup();
	const selectedGroup = useSelectedGroup();
	const focusedGroup = useFocusedGroup();
	const isFocusMode = useIsFocusMode();
	const circularMode = useCircularMode();
	const isCircularMode = useIsCircularMode();

	// Actions
	const {
		selectObject,
		selectObjects,
		deselectAll,
		updateObject,
		commitHistory,
		addObjectById,
		selectGroup,
		moveObjects,
		moveObjectsWithSnap,
		copySelected,
		paste,
		duplicateSelected,
		deleteSelected,
		groupSelected,
		ungroup,
		moveSelectedLayer,
		selectAll,
		startTextEdit,
		endTextEdit,
		exitCircularMode,
		updateCircularCenter,
		updateCircularRadius,
		moveObjectOnCircle,
	} = useEditorActions();

	const { backgroundId, objects } = board;

	// オブジェクトが属するグループを取得するヘルパー関数
	const getGroupForObject = useCallback(
		(index: number): ObjectGroup | undefined => {
			return groups.find((g) => g.objectIndices.includes(index));
		},
		[groups],
	);

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
		handleBackgroundPointerDown: originalBackgroundPointerDown,
		handleDragOver,
		handleDrop,
		handleObjectClick,
		handleObjectPointerDown: originalObjectPointerDown,
		handleRotateStart,
		handleResizeStart,
		handlePointerMove: originalPointerMove,
		handlePointerUp: originalPointerUp,
	} = useCanvasInteraction({
		svgRef,
		objects,
		selectedIndices,
		gridSettings,
		focusedGroupId,
		circularMode,
		selectObject,
		selectObjects,
		selectGroup,
		getGroupForObject,
		updateObject,
		moveObjects,
		moveObjectsWithSnap,
		moveObjectOnCircle,
		commitHistory,
		addObject: addObjectById,
		deselectAll,
	});

	// 長押しフック（タッチデバイス用コンテキストメニュー）
	const handleLongPress = useCallback(
		(clientX: number, clientY: number, objectIndex: number | null) => {
			// 未選択のオブジェクトを長押しした場合は選択する
			if (objectIndex !== null && !selectedIndices.includes(objectIndex)) {
				selectObject(objectIndex);
			}

			setContextMenu({
				isOpen: true,
				x: clientX,
				y: clientY,
				targetIndex: objectIndex,
			});
		},
		[selectedIndices, selectObject],
	);

	const { startLongPress, moveLongPress, cancelLongPress } = useLongPress({
		onLongPress: handleLongPress,
	});

	// 長押し対応のポインターダウン（背景）
	const handleBackgroundPointerDown = useCallback(
		(e: React.PointerEvent) => {
			startLongPress(e, null);
			originalBackgroundPointerDown(e);
		},
		[startLongPress, originalBackgroundPointerDown],
	);

	// 長押し対応のポインターダウン（オブジェクト）
	const handleObjectPointerDown = useCallback(
		(index: number, e: React.PointerEvent) => {
			startLongPress(e, index);
			originalObjectPointerDown(index, e);
		},
		[startLongPress, originalObjectPointerDown],
	);

	// 長押し対応のポインター移動
	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			moveLongPress(e);
			originalPointerMove(e);
		},
		[moveLongPress, originalPointerMove],
	);

	// 長押し対応のポインターアップ
	const handlePointerUp = useCallback(
		(e: React.PointerEvent) => {
			cancelLongPress();
			originalPointerUp(e);
		},
		[cancelLongPress, originalPointerUp],
	);

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

	// キャンバス背景色を取得
	const canvasColorValue =
		CANVAS_COLORS.find((c) => c.id === gridSettings.canvasColor)?.color ??
		"#1e293b";

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
				style={{ touchAction: "none", backgroundColor: canvasColorValue }}
				role="application"
				aria-label="Strategy Board Editor"
			>
				{/* 背景（showBackgroundがtrueの場合のみ表示） */}
				{gridSettings.showBackground && (
					<BackgroundRenderer
						backgroundId={backgroundId}
						width={CANVAS_WIDTH}
						height={CANVAS_HEIGHT}
					/>
				)}

				{/* 編集用グリッドオーバーレイ（同心円/方眼） */}
				<EditorGridOverlay
					type={gridSettings.overlayType}
					width={CANVAS_WIDTH}
					height={CANVAS_HEIGHT}
					settings={gridSettings.overlaySettings}
				/>

				{/* スナップ用グリッド線 */}
				{gridSettings.enabled && gridSettings.showGrid && (
					<GridOverlay
						width={CANVAS_WIDTH}
						height={CANVAS_HEIGHT}
						gridSize={gridSettings.size}
					/>
				)}

				{/* オブジェクト (逆順で描画してレイヤー順を正しくする) */}
				{[...visibleObjects].reverse().map(({ obj, index }) => {
					// フォーカスモードでフォーカス外のオブジェクトは薄く表示
					const isOutsideFocus =
						isFocusMode && !focusedGroup?.objectIndices.includes(index);
					const opacity =
						editingTextIndex === index ? 0.3 : isOutsideFocus ? 0.3 : 1;
					const pointerEvents = isOutsideFocus ? "none" : "auto";

					return (
						// biome-ignore lint/a11y/noStaticElementInteractions: SVG group elements require onClick for selection
						<g
							key={index}
							onClick={(e) => handleObjectClick(index, e)}
							onDoubleClick={(e) => handleObjectDoubleClick(index, e)}
							onPointerDown={(e) => handleObjectPointerDown(index, e)}
							onContextMenu={(e) => handleObjectContextMenu(index, e)}
							style={{
								cursor: isOutsideFocus ? "default" : "move",
								opacity,
								pointerEvents,
							}}
						>
							<ObjectRenderer object={obj} index={index} selected={false} />
						</g>
					);
				})}

				{/* 選択インジケーター (複数選択時のみ) */}
				{selectedIndices.length > 1 &&
					selectedIndices.map((index) => {
						const obj = objects[index];
						if (!obj) return null;
						const bbox = getObjectBoundingBox(
							obj.objectId,
							obj.param1,
							obj.param2,
							obj.param3,
							obj.text,
							obj.position,
						);
						const objScale = obj.size / 100;
						// Lineオブジェクトはbboxが既に座標に基づいて計算されているためrotation=0
						const rotation = obj.objectId === ObjectIds.Line ? 0 : obj.rotation;
						return (
							<SelectionIndicator
								key={`selection-${index}`}
								x={obj.position.x}
								y={obj.position.y}
								width={bbox.width * objScale}
								height={bbox.height * objScale}
								offsetX={(bbox.offsetX ?? 0) * objScale}
								offsetY={(bbox.offsetY ?? 0) * objScale}
								rotation={rotation}
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

				{/* 円形配置モードガイド */}
				{isCircularMode && circularMode && (
					<>
						<CircularGuideOverlay
							center={circularMode.center}
							radius={circularMode.radius}
						/>
						<CircularHandles
							center={circularMode.center}
							radius={circularMode.radius}
							onCenterDrag={updateCircularCenter}
							onCenterDragEnd={() =>
								commitHistory(t("circularMode.centerChanged"))
							}
							onRadiusDrag={updateCircularRadius}
							onRadiusDragEnd={() =>
								commitHistory(t("circularMode.radiusChanged"))
							}
						/>
					</>
				)}

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

			{/* 円形配置モードインジケーター */}
			{isCircularMode && circularMode && (
				<CircularModeIndicator
					objectCount={circularMode.participatingIndices.length}
					onExit={exitCircularMode}
				/>
			)}

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
					moveLayer: moveSelectedLayer,
					selectAll,
				}}
			/>
		</>
	);
}
