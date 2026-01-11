/**
 * Editor E2E tests using Vitest Browser Mode.
 *
 * Test targets:
 * - Editor board initialization and rendering
 * - Adding and selecting objects
 * - Undo/Redo functionality
 */

import "@/lib/i18n";
import { useEffect, useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { EditorBoard } from "@/components/editor/EditorBoard";
import {
	createDefaultObject,
	createEmptyBoard,
	DEFAULT_OVERLAY_SETTINGS,
	EditorStoreProvider,
	type GridSettings,
	useEditorActions,
	useEditorSelector,
} from "@/lib/editor";
import { resetEditorStore } from "@/lib/editor/store/editorStore";
import { globalHistoryStore } from "@/lib/editor/store/globalHistoryStore";
import { ObjectIds } from "@/lib/stgy";

/** Default grid settings */
const DEFAULT_GRID_SETTINGS: GridSettings = {
	enabled: false,
	size: 16,
	showGrid: false,
	overlayType: "none",
	showBackground: true,
	canvasColor: "slate-800",
	overlaySettings: DEFAULT_OVERLAY_SETTINGS,
};

/** Test wrapper for EditorBoard */
function TestEditorBoard() {
	return (
		<EditorStoreProvider
			initialBoard={createEmptyBoard("Test Board")}
			initialGroups={[]}
			initialGridSettings={DEFAULT_GRID_SETTINGS}
			boardId={null}
		>
			<EditorBoard scale={1} />
		</EditorStoreProvider>
	);
}

/** Test component for adding objects and verifying rendering */
function EditorWithObject({ objectId }: { objectId: number }) {
	const board = createEmptyBoard("Test Board");
	const obj = createDefaultObject(objectId);
	board.objects.push(obj);

	return (
		<EditorStoreProvider
			initialBoard={board}
			initialGroups={[]}
			initialGridSettings={DEFAULT_GRID_SETTINGS}
			boardId={null}
		>
			<EditorBoard scale={1} />
		</EditorStoreProvider>
	);
}

describe("Editor E2E", () => {
	beforeEach(() => {
		localStorage.clear();
		// Reset singleton store to isolate each test
		resetEditorStore();
		// Clear global history store
		globalHistoryStore.setState({ histories: new Map() });
	});

	describe("Editor board rendering", () => {
		it("renders an empty board correctly", async () => {
			const screen = await render(<TestEditorBoard />);

			// Verify SVG element exists
			const svg = screen.container.querySelector("svg");
			expect(svg).toBeTruthy();

			// Verify aria-label is set correctly
			await expect
				.element(screen.getByRole("application"))
				.toHaveAttribute("aria-label", "Strategy Board Editor");
		});

		it("sets SVG viewBox correctly", async () => {
			const screen = await render(<TestEditorBoard />);

			const svg = screen.container.querySelector("svg");
			expect(svg?.getAttribute("viewBox")).toBe("0 0 512 384");
		});

		it("doubles size when scale=2", async () => {
			const screen = await render(
				<EditorStoreProvider
					initialBoard={createEmptyBoard("Test Board")}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<EditorBoard scale={2} />
				</EditorStoreProvider>,
			);

			const svg = screen.container.querySelector("svg");
			expect(svg?.getAttribute("width")).toBe("1024");
			expect(svg?.getAttribute("height")).toBe("768");
		});
	});

	describe("Object rendering", () => {
		it("renders CircleAoE object", async () => {
			const screen = await render(
				<EditorWithObject objectId={ObjectIds.CircleAoE} />,
			);

			// Objects are rendered wrapped in g elements
			const objectGroups = screen.container.querySelectorAll("svg > g");
			expect(objectGroups.length).toBeGreaterThan(0);

			// CircleAoE renders as circle or image (original image mode)
			const circles = screen.container.querySelectorAll("circle");
			const images = screen.container.querySelectorAll("image");
			expect(circles.length + images.length).toBeGreaterThan(0);
		});

		it("renders LineAoE object", async () => {
			const screen = await render(
				<EditorWithObject objectId={ObjectIds.LineAoE} />,
			);

			// LineAoE renders as rect
			const objectGroups = screen.container.querySelectorAll("svg > g");
			expect(objectGroups.length).toBeGreaterThan(0);
		});

		it("renders Line object", async () => {
			const screen = await render(
				<EditorWithObject objectId={ObjectIds.Line} />,
			);

			// Verify line element exists
			const lines = screen.container.querySelectorAll("line");
			expect(lines.length).toBeGreaterThan(0);
		});
	});

	describe("Object selection", () => {
		it("selects object when clicked", async () => {
			const board = createEmptyBoard("Test Board");
			const obj = createDefaultObject(ObjectIds.CircleAoE, { x: 100, y: 100 });
			board.objects.push(obj);

			let selectedIds: string[] = [];

			function TestComponent() {
				const ids = useEditorSelector((s) => s.selectedIds);
				selectedIds = ids;
				return <EditorBoard scale={1} />;
			}

			const screen = await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Initial state: no selection
			expect(selectedIds).toHaveLength(0);

			// Click on the object (first object in g element)
			const objectGroup = screen.container.querySelector("svg > g");
			expect(objectGroup).toBeTruthy();
			await userEvent.click(objectGroup!);

			// Verify selection state (after re-render)
			expect(selectedIds).toHaveLength(1);
			expect(selectedIds[0]).toBe(obj.id);
		});

		it("deselects all with deselectAll action", async () => {
			const board = createEmptyBoard("Test Board");
			const obj = createDefaultObject(ObjectIds.CircleAoE, { x: 100, y: 100 });
			board.objects.push(obj);

			let selectedIds: string[] = [];
			const actionsRef: { deselectAll: (() => void) | null } = {
				deselectAll: null,
			};

			function TestComponent() {
				const ids = useEditorSelector((s) => s.selectedIds);
				const { selectObject, deselectAll } = useEditorActions();
				const [initialized, setInitialized] = useState(false);

				selectedIds = ids;
				actionsRef.deselectAll = deselectAll;

				// Select object only on first render
				useEffect(() => {
					if (!initialized) {
						selectObject(obj.id);
						setInitialized(true);
					}
				}, [initialized, selectObject]);

				return <EditorBoard scale={1} />;
			}

			await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Verify selection state (wait for useEffect to run)
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(selectedIds).toHaveLength(1);

			// Call deselectAll
			actionsRef.deselectAll?.();

			// Verify deselection
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(selectedIds).toHaveLength(0);
		});
	});

	describe("Selection handles display", () => {
		it("shows selection handles when single object is selected", async () => {
			const board = createEmptyBoard("Test Board");
			const obj = createDefaultObject(ObjectIds.CircleAoE, { x: 200, y: 200 });
			board.objects.push(obj);

			const screen = await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<EditorBoard scale={1} />
				</EditorStoreProvider>,
			);

			// Click to select object
			const objectGroup = screen.container.querySelector("svg > g");
			expect(objectGroup).toBeTruthy();
			await userEvent.click(objectGroup!);

			// Wait for selection handles (rotation handle=circle r=4, resize handles=rect width=8)
			// Poll for handles
			let rotateHandle: Element | undefined;
			let resizeHandles: Element[] = [];

			for (let i = 0; i < 20; i++) {
				const circles = screen.container.querySelectorAll("svg circle");
				rotateHandle = Array.from(circles).find(
					(c) => c.getAttribute("r") === "4",
				);

				const rects = screen.container.querySelectorAll("svg rect");
				resizeHandles = Array.from(rects).filter(
					(r) => r.getAttribute("width") === "8",
				);

				if (rotateHandle && resizeHandles.length === 4) {
					break;
				}
				await new Promise((resolve) => setTimeout(resolve, 10));
			}

			expect(rotateHandle).toBeTruthy();
			expect(resizeHandles.length).toBe(4);
		});
	});

	describe("Adding and removing objects", () => {
		it("adds object with addObjectById", async () => {
			const board = createEmptyBoard("Test Board");

			let objectCount = 0;
			const actionsRef: { addObjectById: ((id: number) => void) | null } = {
				addObjectById: null,
			};

			function TestComponent() {
				const objects = useEditorSelector((s) => s.board.objects);
				const { addObjectById } = useEditorActions();

				objectCount = objects.length;
				actionsRef.addObjectById = addObjectById;

				return <EditorBoard scale={1} />;
			}

			await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Initial state: no objects
			expect(objectCount).toBe(0);

			// Add CircleAoE
			actionsRef.addObjectById?.(ObjectIds.CircleAoE);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Verify one object was added
			expect(objectCount).toBe(1);
		});

		it("deletes selected objects with deleteSelected", async () => {
			const board = createEmptyBoard("Test Board");
			const obj = createDefaultObject(ObjectIds.CircleAoE, { x: 100, y: 100 });
			board.objects.push(obj);

			let objectCount = 0;
			const actionsRef: {
				selectObject: ((id: string) => void) | null;
				deleteSelected: (() => void) | null;
			} = {
				selectObject: null,
				deleteSelected: null,
			};

			function TestComponent() {
				const objects = useEditorSelector((s) => s.board.objects);
				const { selectObject, deleteSelected } = useEditorActions();

				objectCount = objects.length;
				actionsRef.selectObject = selectObject;
				actionsRef.deleteSelected = deleteSelected;

				return <EditorBoard scale={1} />;
			}

			await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Initial state: 1 object
			expect(objectCount).toBe(1);

			// Select and delete object
			actionsRef.selectObject?.(obj.id);
			await new Promise((resolve) => setTimeout(resolve, 50));

			actionsRef.deleteSelected?.();
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Verify object was deleted
			expect(objectCount).toBe(0);
		});
	});

	describe("Undo/Redo functionality", () => {
		it("undoes object addition with Undo", async () => {
			const board = createEmptyBoard("Test Board");

			let objectCount = 0;
			const actionsRef: {
				addObjectById: ((id: number) => void) | null;
				commitHistory: ((message: string) => void) | null;
				undo: (() => void) | null;
			} = {
				addObjectById: null,
				commitHistory: null,
				undo: null,
			};

			function TestComponent() {
				const objects = useEditorSelector((s) => s.board.objects);
				const { addObjectById, commitHistory, undo } = useEditorActions();

				objectCount = objects.length;
				actionsRef.addObjectById = addObjectById;
				actionsRef.commitHistory = commitHistory;
				actionsRef.undo = undo;

				return <EditorBoard scale={1} />;
			}

			await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Initial state: no objects
			expect(objectCount).toBe(0);

			// Add object and commit to history
			actionsRef.addObjectById?.(ObjectIds.CircleAoE);
			actionsRef.commitHistory?.("Add object");
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(objectCount).toBe(1);

			// Undo to revert
			actionsRef.undo?.();
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(objectCount).toBe(0);
		});

		it("redoes with Redo after Undo", async () => {
			const board = createEmptyBoard("Test Board");

			let objectCount = 0;
			const actionsRef: {
				addObjectById: ((id: number) => void) | null;
				commitHistory: ((message: string) => void) | null;
				undo: (() => void) | null;
				redo: (() => void) | null;
			} = {
				addObjectById: null,
				commitHistory: null,
				undo: null,
				redo: null,
			};

			function TestComponent() {
				const objects = useEditorSelector((s) => s.board.objects);
				const { addObjectById, commitHistory, undo, redo } = useEditorActions();

				objectCount = objects.length;
				actionsRef.addObjectById = addObjectById;
				actionsRef.commitHistory = commitHistory;
				actionsRef.undo = undo;
				actionsRef.redo = redo;

				return <EditorBoard scale={1} />;
			}

			await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Add object and commit to history
			actionsRef.addObjectById?.(ObjectIds.CircleAoE);
			actionsRef.commitHistory?.("Add object");
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(objectCount).toBe(1);

			// Undo to revert
			actionsRef.undo?.();
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(objectCount).toBe(0);

			// Redo to restore
			actionsRef.redo?.();
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(objectCount).toBe(1);
		});
	});

	describe("Multi-selection", () => {
		it("selects multiple objects with Shift+click", async () => {
			const board = createEmptyBoard("Test Board");
			const obj1 = createDefaultObject(ObjectIds.CircleAoE, { x: 100, y: 100 });
			const obj2 = createDefaultObject(ObjectIds.CircleAoE, { x: 300, y: 100 });
			board.objects.push(obj1, obj2);

			let selectedIds: string[] = [];

			function TestComponent() {
				const ids = useEditorSelector((s) => s.selectedIds);
				selectedIds = ids;
				return <EditorBoard scale={1} />;
			}

			const screen = await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Click the first object
			const objectGroups = screen.container.querySelectorAll("svg > g");
			expect(objectGroups.length).toBe(2);

			await userEvent.click(objectGroups[0]);
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(selectedIds).toHaveLength(1);

			// Shift+click to add second object to selection
			await userEvent.click(objectGroups[1], { modifiers: ["Shift"] });
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(selectedIds).toHaveLength(2);
		});

		it("selects all objects with selectAll", async () => {
			const board = createEmptyBoard("Test Board");
			const obj1 = createDefaultObject(ObjectIds.CircleAoE, { x: 100, y: 100 });
			const obj2 = createDefaultObject(ObjectIds.CircleAoE, { x: 300, y: 100 });
			const obj3 = createDefaultObject(ObjectIds.CircleAoE, { x: 200, y: 200 });
			board.objects.push(obj1, obj2, obj3);

			let selectedIds: string[] = [];
			const actionsRef: { selectAll: (() => void) | null } = {
				selectAll: null,
			};

			function TestComponent() {
				const ids = useEditorSelector((s) => s.selectedIds);
				const { selectAll } = useEditorActions();

				selectedIds = ids;
				actionsRef.selectAll = selectAll;

				return <EditorBoard scale={1} />;
			}

			await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Initial state: no selection
			expect(selectedIds).toHaveLength(0);

			// Select all
			actionsRef.selectAll?.();
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Verify all 3 are selected
			expect(selectedIds).toHaveLength(3);
		});
	});

	describe("Moving objects", () => {
		it("changes object position with moveObjects", async () => {
			const board = createEmptyBoard("Test Board");
			const obj = createDefaultObject(ObjectIds.CircleAoE, { x: 100, y: 100 });
			board.objects.push(obj);

			let objectPosition = { x: 0, y: 0 };
			const actionsRef: {
				selectObject: ((id: string) => void) | null;
				moveObjects: ((ids: string[], dx: number, dy: number) => void) | null;
			} = {
				selectObject: null,
				moveObjects: null,
			};

			function TestComponent() {
				const objects = useEditorSelector((s) => s.board.objects);
				const { selectObject, moveObjects } = useEditorActions();

				if (objects.length > 0) {
					objectPosition = objects[0].position;
				}
				actionsRef.selectObject = selectObject;
				actionsRef.moveObjects = moveObjects;

				return <EditorBoard scale={1} />;
			}

			await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Verify initial position
			expect(objectPosition.x).toBe(100);
			expect(objectPosition.y).toBe(100);

			// Move object
			actionsRef.moveObjects?.([obj.id], 50, 30);
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Verify position after move
			expect(objectPosition.x).toBe(150);
			expect(objectPosition.y).toBe(130);
		});
	});

	describe("Duplicating objects", () => {
		it("duplicates selected object with duplicateSelected", async () => {
			const board = createEmptyBoard("Test Board");
			const obj = createDefaultObject(ObjectIds.CircleAoE, { x: 100, y: 100 });
			board.objects.push(obj);

			let objectCount = 0;
			const actionsRef: {
				selectObject: ((id: string) => void) | null;
				duplicateSelected: (() => void) | null;
			} = {
				selectObject: null,
				duplicateSelected: null,
			};

			function TestComponent() {
				const objects = useEditorSelector((s) => s.board.objects);
				const { selectObject, duplicateSelected } = useEditorActions();

				objectCount = objects.length;
				actionsRef.selectObject = selectObject;
				actionsRef.duplicateSelected = duplicateSelected;

				return <EditorBoard scale={1} />;
			}

			await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Initial state: 1 object
			expect(objectCount).toBe(1);

			// Select and duplicate object
			actionsRef.selectObject?.(obj.id);
			await new Promise((resolve) => setTimeout(resolve, 50));

			actionsRef.duplicateSelected?.();
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Verify there are now 2 objects
			expect(objectCount).toBe(2);
		});
	});

	describe("Copy and paste", () => {
		it("copies and pastes objects with copySelected and paste", async () => {
			const board = createEmptyBoard("Test Board");
			const obj = createDefaultObject(ObjectIds.CircleAoE, { x: 100, y: 100 });
			board.objects.push(obj);

			let objectCount = 0;
			const actionsRef: {
				selectObject: ((id: string) => void) | null;
				copySelected: (() => void) | null;
				paste: (() => void) | null;
			} = {
				selectObject: null,
				copySelected: null,
				paste: null,
			};

			function TestComponent() {
				const objects = useEditorSelector((s) => s.board.objects);
				const { selectObject, copySelected, paste } = useEditorActions();

				objectCount = objects.length;
				actionsRef.selectObject = selectObject;
				actionsRef.copySelected = copySelected;
				actionsRef.paste = paste;

				return <EditorBoard scale={1} />;
			}

			await render(
				<EditorStoreProvider
					initialBoard={board}
					initialGroups={[]}
					initialGridSettings={DEFAULT_GRID_SETTINGS}
					boardId={null}
				>
					<TestComponent />
				</EditorStoreProvider>,
			);

			// Initial state: 1 object
			expect(objectCount).toBe(1);

			// Select and copy object
			actionsRef.selectObject?.(obj.id);
			await new Promise((resolve) => setTimeout(resolve, 50));

			actionsRef.copySelected?.();
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Paste
			actionsRef.paste?.();
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Verify there are now 2 objects
			expect(objectCount).toBe(2);
		});
	});
});
