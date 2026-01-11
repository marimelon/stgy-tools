/**
 * Property panel component
 *
 * Displays board settings or object properties based on selection state
 */

import { useCallback } from "react";
import {
	useCircularMode,
	useEditorActions,
	useIsCircularMode,
	useSelectedIds,
	useSelectedObjects,
} from "@/lib/editor";
import { BatchPropertyPanel } from "./BatchPropertyPanel";
import { BoardPropertyPanel } from "./BoardPropertyPanel";
import { CircularPropertyPanel } from "./CircularPropertyPanel";
import { ObjectPropertyPanel } from "./ObjectPropertyPanel";
export function PropertyPanel() {
	const selectedIds = useSelectedIds();
	const selectedObjects = useSelectedObjects();
	const isCircularMode = useIsCircularMode();
	const circularMode = useCircularMode();
	const {
		updateObject,
		updateSelectedObjectsBatch,
		commitHistory,
		updateBoardMeta,
		updateCircularCenter,
		updateCircularRadius,
	} = useEditorActions();

	const selectedObject =
		selectedObjects.length === 1 ? selectedObjects[0] : null;
	const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;

	const isMultipleSelection = selectedObjects.length > 1;

	const handleUpdateObject = useCallback(
		(updates: Parameters<typeof updateObject>[1]) => {
			if (selectedId !== null) {
				updateObject(selectedId, updates);
			}
		},
		[selectedId, updateObject],
	);

	if (isCircularMode && circularMode) {
		return (
			<CircularPropertyPanel
				center={circularMode.center}
				radius={circularMode.radius}
				objectCount={circularMode.participatingIds.length}
				onCenterChange={updateCircularCenter}
				onRadiusChange={updateCircularRadius}
				onCommitHistory={commitHistory}
			/>
		);
	}

	if (isMultipleSelection) {
		return (
			<BatchPropertyPanel
				objects={selectedObjects}
				onUpdate={updateSelectedObjectsBatch}
				onCommitHistory={commitHistory}
			/>
		);
	}

	if (selectedObject && selectedId !== null) {
		return (
			<ObjectPropertyPanel
				object={selectedObject}
				onUpdate={handleUpdateObject}
				onCommitHistory={commitHistory}
			/>
		);
	}

	return (
		<BoardPropertyPanel
			onUpdateMeta={updateBoardMeta}
			onCommitHistory={commitHistory}
		/>
	);
}
