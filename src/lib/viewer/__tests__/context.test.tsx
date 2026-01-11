import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	ViewerStoreProvider,
	parseMultipleStgyCodes,
	useViewerActions,
	useViewerSelector,
} from "../context";

const SAMPLE_STGY_1 =
	"[stgy:a7AIxEt68bIksM7YvDMlkmKJL8iH2Eq-2vDUI+1PGMl9FEMl9N2M0bTMr4TUFAzEjPTEjX2ElA1Mvv2MvtyMQKzM9KzMTXvInPyImeyKAj6KgJ7KAZAKAZAKAD-K4D-KYFaLoJdLoJdLYEwLIE8K4E8LYDA]";
const SAMPLE_STGY_2 =
	"[stgy:a4K3jw7yaAaYql1cKgvD--T2erqHuyZZ1F+csWXFvyojxXctx8m+]";
const SAMPLE_STGY_3 =
	"[stgy:a3IS8cOpvTvIBSxP9thmjjreSCBOnRJJx5ZPf+wzb2RDff3qkPzLaHNjzLVpOTm+kd3VUk55IAVDQladre9+fJ712RpOXmzqfU]";

function createTestBoards() {
	return parseMultipleStgyCodes(
		`${SAMPLE_STGY_1}\n${SAMPLE_STGY_2}\n${SAMPLE_STGY_3}`,
	);
}

describe("ViewerStore", () => {
	describe("reorderBoards", () => {
		it("should move board from index 0 to index 2", () => {
			const initialBoards = createTestBoards();
			const originalIds = initialBoards.map((b) => b.id);

			const { result } = renderHook(
				() => ({
					boards: useViewerSelector((s) => s.boards),
					actions: useViewerActions(),
				}),
				{
					wrapper: ({ children }) => (
						<ViewerStoreProvider initialBoards={initialBoards}>
							{children}
						</ViewerStoreProvider>
					),
				},
			);

			act(() => {
				result.current.actions.reorderBoards(0, 2);
			});

			const newIds = result.current.boards.map((b) => b.id);
			// [0, 1, 2] -> [1, 2, 0]
			expect(newIds).toEqual([originalIds[1], originalIds[2], originalIds[0]]);
		});

		it("should move board from index 2 to index 0", () => {
			const initialBoards = createTestBoards();
			const originalIds = initialBoards.map((b) => b.id);

			const { result } = renderHook(
				() => ({
					boards: useViewerSelector((s) => s.boards),
					actions: useViewerActions(),
				}),
				{
					wrapper: ({ children }) => (
						<ViewerStoreProvider initialBoards={initialBoards}>
							{children}
						</ViewerStoreProvider>
					),
				},
			);

			act(() => {
				result.current.actions.reorderBoards(2, 0);
			});

			const newIds = result.current.boards.map((b) => b.id);
			// [0, 1, 2] -> [2, 0, 1]
			expect(newIds).toEqual([originalIds[2], originalIds[0], originalIds[1]]);
		});

		it("should move board from index 0 to index 1 (adjacent swap)", () => {
			const initialBoards = createTestBoards();
			const originalIds = initialBoards.map((b) => b.id);

			const { result } = renderHook(
				() => ({
					boards: useViewerSelector((s) => s.boards),
					actions: useViewerActions(),
				}),
				{
					wrapper: ({ children }) => (
						<ViewerStoreProvider initialBoards={initialBoards}>
							{children}
						</ViewerStoreProvider>
					),
				},
			);

			act(() => {
				result.current.actions.reorderBoards(0, 1);
			});

			const newIds = result.current.boards.map((b) => b.id);
			// [0, 1, 2] -> [1, 0, 2]
			expect(newIds).toEqual([originalIds[1], originalIds[0], originalIds[2]]);
		});

		it("should not change order when fromIndex equals toIndex", () => {
			const initialBoards = createTestBoards();
			const originalIds = initialBoards.map((b) => b.id);

			const { result } = renderHook(
				() => ({
					boards: useViewerSelector((s) => s.boards),
					actions: useViewerActions(),
				}),
				{
					wrapper: ({ children }) => (
						<ViewerStoreProvider initialBoards={initialBoards}>
							{children}
						</ViewerStoreProvider>
					),
				},
			);

			act(() => {
				result.current.actions.reorderBoards(1, 1);
			});

			const newIds = result.current.boards.map((b) => b.id);
			expect(newIds).toEqual(originalIds);
		});

		it("should preserve board data after reorder", () => {
			const initialBoards = createTestBoards();
			const originalStgyCodes = initialBoards.map((b) => b.stgyCode);

			const { result } = renderHook(
				() => ({
					boards: useViewerSelector((s) => s.boards),
					actions: useViewerActions(),
				}),
				{
					wrapper: ({ children }) => (
						<ViewerStoreProvider initialBoards={initialBoards}>
							{children}
						</ViewerStoreProvider>
					),
				},
			);

			act(() => {
				result.current.actions.reorderBoards(0, 2);
			});

			const newStgyCodes = result.current.boards.map((b) => b.stgyCode);
			// データが保持されていることを確認
			expect(newStgyCodes).toEqual([
				originalStgyCodes[1],
				originalStgyCodes[2],
				originalStgyCodes[0],
			]);
		});

		it("should not affect activeId after reorder", () => {
			const initialBoards = createTestBoards();

			const { result } = renderHook(
				() => ({
					activeId: useViewerSelector((s) => s.activeId),
					actions: useViewerActions(),
				}),
				{
					wrapper: ({ children }) => (
						<ViewerStoreProvider
							initialBoards={initialBoards}
							initialActiveId={initialBoards[0].id}
						>
							{children}
						</ViewerStoreProvider>
					),
				},
			);

			const originalActiveId = result.current.activeId;

			act(() => {
				result.current.actions.reorderBoards(0, 2);
			});

			// activeIdは変更されない
			expect(result.current.activeId).toBe(originalActiveId);
		});

		it("should ignore invalid fromIndex (negative)", () => {
			const initialBoards = createTestBoards();
			const originalIds = initialBoards.map((b) => b.id);

			const { result } = renderHook(
				() => ({
					boards: useViewerSelector((s) => s.boards),
					actions: useViewerActions(),
				}),
				{
					wrapper: ({ children }) => (
						<ViewerStoreProvider initialBoards={initialBoards}>
							{children}
						</ViewerStoreProvider>
					),
				},
			);

			act(() => {
				result.current.actions.reorderBoards(-1, 1);
			});

			const newIds = result.current.boards.map((b) => b.id);
			expect(newIds).toEqual(originalIds);
		});

		it("should ignore invalid toIndex (out of bounds)", () => {
			const initialBoards = createTestBoards();
			const originalIds = initialBoards.map((b) => b.id);

			const { result } = renderHook(
				() => ({
					boards: useViewerSelector((s) => s.boards),
					actions: useViewerActions(),
				}),
				{
					wrapper: ({ children }) => (
						<ViewerStoreProvider initialBoards={initialBoards}>
							{children}
						</ViewerStoreProvider>
					),
				},
			);

			act(() => {
				result.current.actions.reorderBoards(0, 10);
			});

			const newIds = result.current.boards.map((b) => b.id);
			expect(newIds).toEqual(originalIds);
		});
	});
});
