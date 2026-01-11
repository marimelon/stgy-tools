/**
 * Editor board component
 *
 * Extends BoardViewer with drag/rotate/resize interactions
 */

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	BackgroundRenderer,
	getObjectBoundingBox,
	ObjectRenderer,
} from "@/components/board";
import { calculateLineEndpoint } from "@/lib/board";
import {
	CANVAS_COLORS,
	type EditorBoardProps,
	useBoard,
	useCanGroup,
	useCanvasInteraction,
	useCircularMode,
	useEditingTextId,
	useEditorActions,
	useFocusedGroup,
	useFocusedGroupId,
	useGlobalClipboard,
	useGridSettings,
	useGroups,
	useIsCircularMode,
	useIsFocusMode,
	useLongPress,
	useSelectedGroup,
	useSelectedIds,
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

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;
export function EditorBoard({ scale = 1 }: EditorBoardProps) {
	const { t } = useTranslation();

	const board = useBoard();
	const selectedIds = useSelectedIds();
	const gridSettings = useGridSettings();
	const hasClipboard = useGlobalClipboard();
	const editingTextId = useEditingTextId();
	const focusedGroupId = useFocusedGroupId();
	const groups = useGroups();

	const canGroup = useCanGroup();
	const selectedGroup = useSelectedGroup();
	const focusedGroup = useFocusedGroup();
	const isFocusMode = useIsFocusMode();
	const circularMode = useCircularMode();
	const isCircularMode = useIsCircularMode();

	const selectedIdsSet = new Set(selectedIds);

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

	const getGroupForObject = useCallback(
		(objectId: string): ObjectGroup | undefined => {
			return groups.find((g) => g.objectIds.includes(objectId));
		},
		[groups],
	);

	const svgRef = useRef<SVGSVGElement>(null);

	const [contextMenu, setContextMenu] = useState<ContextMenuState>({
		isOpen: false,
		x: 0,
		y: 0,
		targetId: null,
	});

	const closeContextMenu = useCallback(() => {
		setContextMenu((prev) => ({ ...prev, isOpen: false }));
	}, []);

	const handleObjectDoubleClick = useCallback(
		(objectId: string, e: React.MouseEvent) => {
			e.stopPropagation();
			const obj = objects.find((o) => o.id === objectId);
			if (obj?.objectId === ObjectIds.Text && !obj.flags.locked) {
				startTextEdit(objectId);
			}
		},
		[objects, startTextEdit],
	);

	const handleBackgroundContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setContextMenu({
			isOpen: true,
			x: e.clientX,
			y: e.clientY,
			targetId: null,
		});
	}, []);

	const handleObjectContextMenu = useCallback(
		(objectId: string, e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			// Select the object if not already selected
			if (!selectedIdsSet.has(objectId)) {
				selectObject(objectId);
			}

			setContextMenu({
				isOpen: true,
				x: e.clientX,
				y: e.clientY,
				targetId: objectId,
			});
		},
		[selectedIdsSet, selectObject],
	);

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
		selectedIds,
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

	// Long press hook for touch device context menu
	const handleLongPress = useCallback(
		(clientX: number, clientY: number, objectId: string | null) => {
			// Select the object if not already selected
			if (objectId !== null && !selectedIdsSet.has(objectId)) {
				selectObject(objectId);
			}

			setContextMenu({
				isOpen: true,
				x: clientX,
				y: clientY,
				targetId: objectId,
			});
		},
		[selectedIdsSet, selectObject],
	);

	const { startLongPress, moveLongPress, cancelLongPress } = useLongPress({
		onLongPress: handleLongPress,
	});

	const handleBackgroundPointerDown = useCallback(
		(e: React.PointerEvent) => {
			startLongPress(e, null);
			originalBackgroundPointerDown(e);
		},
		[startLongPress, originalBackgroundPointerDown],
	);

	const handleObjectPointerDown = useCallback(
		(objectId: string, e: React.PointerEvent) => {
			startLongPress(e, objectId);
			originalObjectPointerDown(objectId, e);
		},
		[startLongPress, originalObjectPointerDown],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			moveLongPress(e);
			originalPointerMove(e);
		},
		[moveLongPress, originalPointerMove],
	);

	const handlePointerUp = useCallback(
		(e: React.PointerEvent) => {
			cancelLongPress();
			originalPointerUp(e);
		},
		[cancelLongPress, originalPointerUp],
	);

	const visibleObjects = objects.filter((obj) => obj.flags.visible);

	const selectedObject =
		selectedIds.length === 1
			? objects.find((o) => o.id === selectedIds[0])
			: null;

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
				{gridSettings.showBackground && (
					<BackgroundRenderer
						backgroundId={backgroundId}
						width={CANVAS_WIDTH}
						height={CANVAS_HEIGHT}
					/>
				)}

				<EditorGridOverlay
					type={gridSettings.overlayType}
					width={CANVAS_WIDTH}
					height={CANVAS_HEIGHT}
					settings={gridSettings.overlaySettings}
				/>

				{gridSettings.enabled && gridSettings.showGrid && (
					<GridOverlay
						width={CANVAS_WIDTH}
						height={CANVAS_HEIGHT}
						gridSize={gridSettings.size}
					/>
				)}

				{/* Objects rendered in reverse order for correct layer ordering */}
				{[...visibleObjects].reverse().map((obj) => {
					const isOutsideFocus =
						isFocusMode && !focusedGroup?.objectIds.includes(obj.id);
					const opacity =
						editingTextId === obj.id ? 0.3 : isOutsideFocus ? 0.3 : 1;
					const pointerEvents = isOutsideFocus ? "none" : "auto";

					return (
						// biome-ignore lint/a11y/noStaticElementInteractions: SVG group elements require onClick for selection
						<g
							key={obj.id}
							onClick={(e) => handleObjectClick(obj.id, e)}
							onDoubleClick={(e) => handleObjectDoubleClick(obj.id, e)}
							onPointerDown={(e) => handleObjectPointerDown(obj.id, e)}
							onContextMenu={(e) => handleObjectContextMenu(obj.id, e)}
							style={{
								cursor: isOutsideFocus ? "default" : "move",
								opacity,
								pointerEvents,
							}}
						>
							<ObjectRenderer object={obj} selected={false} />
						</g>
					);
				})}

				{/* Selection indicator for multiple selection */}
				{selectedIds.length > 1 &&
					selectedIds.map((objectId) => {
						const obj = objects.find((o) => o.id === objectId);
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

						// Line objects display bbox centered on midpoint
						if (obj.objectId === ObjectIds.Line) {
							const endpoint = calculateLineEndpoint(
								obj.position,
								obj.param1,
								obj.param2,
							);
							const centerX = (obj.position.x + endpoint.x) / 2;
							const centerY = (obj.position.y + endpoint.y) / 2;
							const dx = endpoint.x - obj.position.x;
							const dy = endpoint.y - obj.position.y;
							const lineRotation = (Math.atan2(dy, dx) * 180) / Math.PI;

							return (
								<SelectionIndicator
									key={`selection-${objectId}`}
									x={centerX}
									y={centerY}
									width={bbox.width * objScale}
									height={bbox.height * objScale}
									offsetX={0}
									offsetY={0}
									rotation={lineRotation}
								/>
							);
						}

						return (
							<SelectionIndicator
								key={`selection-${objectId}`}
								x={obj.position.x}
								y={obj.position.y}
								width={bbox.width * objScale}
								height={bbox.height * objScale}
								offsetX={(bbox.offsetX ?? 0) * objScale}
								offsetY={(bbox.offsetY ?? 0) * objScale}
								rotation={obj.rotation}
							/>
						);
					})}

				{editingTextId !== null &&
					(() => {
						const editingObject = objects.find((o) => o.id === editingTextId);
						return editingObject ? (
							<InlineTextEditor
								object={editingObject}
								onEndEdit={endTextEdit}
							/>
						) : null;
					})()}

				{/* Selection handles (single selection only, hidden during text edit) */}
				{selectedObject &&
					selectedIds.length === 1 &&
					editingTextId === null &&
					(() => {
						const selectedId = selectedIds[0];

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
										updateObject(selectedId, {
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
										updateObject(selectedId, {
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

			{isCircularMode && circularMode && (
				<CircularModeIndicator
					objectCount={circularMode.participatingIds.length}
					onExit={exitCircularMode}
				/>
			)}

			<ContextMenu
				menuState={contextMenu}
				onClose={closeContextMenu}
				selectedIds={selectedIds}
				hasClipboard={hasClipboard}
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
