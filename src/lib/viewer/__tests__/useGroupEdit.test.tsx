import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GroupInfo } from "../useGroupEdit";

// Mock server functions
vi.mock("@/lib/server/shortLinks/serverFn", () => ({
	verifyGroupEditKeyFn: vi.fn(),
	updateGroupFn: vi.fn(),
	deleteGroupFn: vi.fn(),
}));

// Mock i18n
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string) => fallback ?? key,
	}),
}));

// Import after mocks
import {
	deleteGroupFn,
	updateGroupFn,
	verifyGroupEditKeyFn,
} from "@/lib/server/shortLinks/serverFn";
import { useGroupEdit } from "../useGroupEdit";

const mockVerifyGroupEditKeyFn = verifyGroupEditKeyFn as unknown as ReturnType<
	typeof vi.fn
>;
const mockUpdateGroupFn = updateGroupFn as unknown as ReturnType<typeof vi.fn>;
const mockDeleteGroupFn = deleteGroupFn as unknown as ReturnType<typeof vi.fn>;

describe("useGroupEdit", () => {
	const defaultOptions = {
		groupId: "testGroupId",
		groupInfo: {
			name: "Test Group",
			description: "Test Description",
			version: 1,
		} as GroupInfo,
		stgyCodes: ["[stgy:aTest1]", "[stgy:aTest2]"],
		onSaveSuccess: vi.fn(),
		onCancelReset: vi.fn().mockReturnValue(["[stgy:aOriginal]"]),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset window.location mock
		Object.defineProperty(window, "location", {
			value: { href: "" },
			writable: true,
			configurable: true,
		});
	});

	describe("initial state", () => {
		it("should initialize with groupInfo values", () => {
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			expect(result.current.isEditMode).toBe(false);
			expect(result.current.editedName).toBe("Test Group");
			expect(result.current.editedDescription).toBe("Test Description");
			expect(result.current.displayedGroupName).toBe("Test Group");
			expect(result.current.displayedGroupDescription).toBe("Test Description");
			expect(result.current.groupVersion).toBe(1);
			expect(result.current.isUpdating).toBe(false);
			expect(result.current.updateError).toBeNull();
			expect(result.current.isDeleting).toBe(false);
			expect(result.current.deleteError).toBeNull();
		});

		it("should initialize with empty values when groupInfo is undefined", () => {
			const { result } = renderHook(() =>
				useGroupEdit({ ...defaultOptions, groupInfo: undefined }),
			);

			expect(result.current.editedName).toBe("");
			expect(result.current.editedDescription).toBe("");
			expect(result.current.displayedGroupName).toBe("");
			expect(result.current.displayedGroupDescription).toBeUndefined();
			expect(result.current.groupVersion).toBeUndefined();
		});

		it("should initialize all dialogs as closed", () => {
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			expect(result.current.dialogs.editKey.isOpen).toBe(false);
			expect(result.current.dialogs.history.isOpen).toBe(false);
			expect(result.current.dialogs.delete.isOpen).toBe(false);
		});
	});

	describe("handleEditClick", () => {
		it("should open edit key dialog when no edit key is set", () => {
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			act(() => {
				result.current.handleEditClick();
			});

			expect(result.current.dialogs.editKey.isOpen).toBe(true);
			expect(result.current.isEditMode).toBe(false);
		});

		it("should enter edit mode directly when edit key is already set", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// First, set the edit key by confirming
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Exit edit mode
			act(() => {
				result.current.handleCancelEdit();
			});

			expect(result.current.isEditMode).toBe(false);

			// Now click edit again - should enter directly
			act(() => {
				result.current.handleEditClick();
			});

			expect(result.current.isEditMode).toBe(true);
			expect(result.current.dialogs.editKey.isOpen).toBe(false);
		});
	});

	describe("handleEditKeyConfirm", () => {
		it("should return true and enter edit mode when key is valid", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			let confirmResult: boolean;
			await act(async () => {
				confirmResult = await result.current.handleEditKeyConfirm("validKey");
			});

			expect(confirmResult!).toBe(true);
			expect(result.current.isEditMode).toBe(true);
			expect(mockVerifyGroupEditKeyFn).toHaveBeenCalledWith({
				data: { groupId: "testGroupId", editKey: "validKey" },
			});
		});

		it("should return false when key is invalid", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(false);
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			let confirmResult: boolean;
			await act(async () => {
				confirmResult = await result.current.handleEditKeyConfirm("invalidKey");
			});

			expect(confirmResult!).toBe(false);
			expect(result.current.isEditMode).toBe(false);
		});

		it("should return false when verification throws", async () => {
			mockVerifyGroupEditKeyFn.mockRejectedValue(new Error("Network error"));
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			let confirmResult: boolean;
			await act(async () => {
				confirmResult = await result.current.handleEditKeyConfirm("anyKey");
			});

			expect(confirmResult!).toBe(false);
			expect(result.current.isEditMode).toBe(false);
		});

		it("should return false when groupId is undefined", async () => {
			const { result } = renderHook(() =>
				useGroupEdit({ ...defaultOptions, groupId: undefined }),
			);

			let confirmResult: boolean;
			await act(async () => {
				confirmResult = await result.current.handleEditKeyConfirm("anyKey");
			});

			expect(confirmResult!).toBe(false);
			expect(mockVerifyGroupEditKeyFn).not.toHaveBeenCalled();
		});
	});

	describe("handleCancelEdit", () => {
		it("should exit edit mode and reset values", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Enter edit mode
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Modify values
			act(() => {
				result.current.setEditedName("Modified Name");
				result.current.setEditedDescription("Modified Description");
			});

			// Cancel edit
			act(() => {
				result.current.handleCancelEdit();
			});

			expect(result.current.isEditMode).toBe(false);
			expect(result.current.editedName).toBe("Test Group");
			expect(result.current.editedDescription).toBe("Test Description");
			expect(result.current.updateError).toBeNull();
			expect(defaultOptions.onCancelReset).toHaveBeenCalled();
		});
	});

	describe("handleSaveEdit", () => {
		it("should save successfully and update state", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			mockUpdateGroupFn.mockResolvedValue({
				success: true,
				data: { version: 2 },
			});

			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Enter edit mode
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Modify values
			act(() => {
				result.current.setEditedName("New Name");
				result.current.setEditedDescription("New Description");
			});

			// Save
			await act(async () => {
				await result.current.handleSaveEdit();
			});

			expect(result.current.isEditMode).toBe(false);
			expect(result.current.groupVersion).toBe(2);
			expect(result.current.displayedGroupName).toBe("New Name");
			expect(result.current.displayedGroupDescription).toBe("New Description");
			expect(result.current.updateError).toBeNull();
			expect(defaultOptions.onSaveSuccess).toHaveBeenCalledWith(
				defaultOptions.stgyCodes,
			);
		});

		it("should set error when save fails", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			mockUpdateGroupFn.mockResolvedValue({
				success: false,
				error: "Invalid data",
				code: "INVALID_NAME",
			});

			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Enter edit mode
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Save
			await act(async () => {
				await result.current.handleSaveEdit();
			});

			expect(result.current.isEditMode).toBe(true);
			expect(result.current.updateError).toBe("Invalid data");
			expect(defaultOptions.onSaveSuccess).not.toHaveBeenCalled();
		});

		it("should set error when save throws", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			mockUpdateGroupFn.mockRejectedValue(new Error("Network error"));

			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Enter edit mode
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Save
			await act(async () => {
				await result.current.handleSaveEdit();
			});

			expect(result.current.isEditMode).toBe(true);
			expect(result.current.updateError).toBe(
				"viewer.group.error.STORAGE_ERROR",
			);
		});

		it("should not save when groupId is undefined", async () => {
			const { result } = renderHook(() =>
				useGroupEdit({ ...defaultOptions, groupId: undefined }),
			);

			await act(async () => {
				await result.current.handleSaveEdit();
			});

			expect(mockUpdateGroupFn).not.toHaveBeenCalled();
		});

		it("should not save when already updating", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			mockUpdateGroupFn.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() => resolve({ success: true, data: { version: 2 } }),
							100,
						),
					),
			);

			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Enter edit mode
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Start first save
			act(() => {
				result.current.handleSaveEdit();
			});

			expect(result.current.isUpdating).toBe(true);

			// Try to save again while updating
			await act(async () => {
				await result.current.handleSaveEdit();
			});

			// Should only be called once
			expect(mockUpdateGroupFn).toHaveBeenCalledTimes(1);
		});

		it("should set isUpdating during save operation", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			let resolveUpdate: (value: unknown) => void;
			mockUpdateGroupFn.mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveUpdate = resolve;
					}),
			);

			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Enter edit mode
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Start save
			act(() => {
				result.current.handleSaveEdit();
			});

			expect(result.current.isUpdating).toBe(true);

			// Complete save
			await act(async () => {
				resolveUpdate!({ success: true, data: { version: 2 } });
			});

			await waitFor(() => {
				expect(result.current.isUpdating).toBe(false);
			});
		});
	});

	describe("handleDeleteGroup", () => {
		it("should delete successfully and redirect", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			mockDeleteGroupFn.mockResolvedValue({ success: true });

			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Enter edit mode to set edit key
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Delete
			await act(async () => {
				await result.current.handleDeleteGroup();
			});

			expect(result.current.dialogs.delete.isOpen).toBe(false);
			expect(window.location.href).toBe("/");
		});

		it("should set error when delete fails", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			mockDeleteGroupFn.mockResolvedValue({
				success: false,
				error: "Not authorized",
				code: "INVALID_EDIT_KEY",
			});

			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Enter edit mode
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Delete
			await act(async () => {
				await result.current.handleDeleteGroup();
			});

			expect(result.current.deleteError).toBe("Not authorized");
		});

		it("should set error when delete throws", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			mockDeleteGroupFn.mockRejectedValue(new Error("Network error"));

			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Enter edit mode
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Delete
			await act(async () => {
				await result.current.handleDeleteGroup();
			});

			expect(result.current.deleteError).toBe(
				"viewer.group.error.STORAGE_ERROR",
			);
		});

		it("should not delete when groupId is undefined", async () => {
			const { result } = renderHook(() =>
				useGroupEdit({ ...defaultOptions, groupId: undefined }),
			);

			await act(async () => {
				await result.current.handleDeleteGroup();
			});

			expect(mockDeleteGroupFn).not.toHaveBeenCalled();
		});

		it("should set isDeleting during delete operation", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			let resolveDelete: (value: unknown) => void;
			mockDeleteGroupFn.mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveDelete = resolve;
					}),
			);

			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Enter edit mode
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			// Start delete
			act(() => {
				result.current.handleDeleteGroup();
			});

			expect(result.current.isDeleting).toBe(true);

			// Complete delete
			await act(async () => {
				resolveDelete!({ success: true });
			});

			await waitFor(() => {
				expect(result.current.isDeleting).toBe(false);
			});
		});
	});

	describe("dialog handlers", () => {
		it("handleHistoryClick should open history dialog", () => {
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			act(() => {
				result.current.handleHistoryClick();
			});

			expect(result.current.dialogs.history.isOpen).toBe(true);
		});

		it("handleDeleteClick should open delete dialog and clear error", () => {
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			act(() => {
				result.current.handleDeleteClick();
			});

			expect(result.current.dialogs.delete.isOpen).toBe(true);
			expect(result.current.deleteError).toBeNull();
		});

		it("handleDeleteDialogClose should close dialog and clear error", () => {
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			// Open delete dialog
			act(() => {
				result.current.handleDeleteClick();
			});

			// Close it
			act(() => {
				result.current.handleDeleteDialogClose(false);
			});

			expect(result.current.dialogs.delete.isOpen).toBe(false);
			expect(result.current.deleteError).toBeNull();
		});
	});

	describe("version navigation", () => {
		it("handleViewVersion should navigate to version URL", () => {
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			act(() => {
				result.current.handleViewVersion({ version: 2 });
			});

			expect(window.location.href).toBe("/?g=testGroupId&v=2");
		});

		it("handleViewVersion should not navigate when groupId is undefined", () => {
			const { result } = renderHook(() =>
				useGroupEdit({ ...defaultOptions, groupId: undefined }),
			);

			act(() => {
				result.current.handleViewVersion({ version: 2 });
			});

			expect(window.location.href).toBe("");
		});

		it("handleBackToCurrentVersion should navigate to group URL", () => {
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			act(() => {
				result.current.handleBackToCurrentVersion();
			});

			expect(window.location.href).toBe("/?g=testGroupId");
		});

		it("handleBackToCurrentVersion should not navigate when groupId is undefined", () => {
			const { result } = renderHook(() =>
				useGroupEdit({ ...defaultOptions, groupId: undefined }),
			);

			act(() => {
				result.current.handleBackToCurrentVersion();
			});

			expect(window.location.href).toBe("");
		});
	});

	describe("groupInfo sync", () => {
		it("should sync editedName and editedDescription when groupInfo changes", () => {
			const { result, rerender } = renderHook((props) => useGroupEdit(props), {
				initialProps: defaultOptions,
			});

			const newGroupInfo = {
				name: "Updated Group",
				description: "Updated Description",
				version: 3,
			};

			rerender({ ...defaultOptions, groupInfo: newGroupInfo });

			expect(result.current.editedName).toBe("Updated Group");
			expect(result.current.editedDescription).toBe("Updated Description");
			expect(result.current.groupVersion).toBe(3);
		});

		it("should clear local overrides when groupInfo changes", async () => {
			mockVerifyGroupEditKeyFn.mockResolvedValue(true);
			mockUpdateGroupFn.mockResolvedValue({
				success: true,
				data: { version: 2 },
			});

			const { result, rerender } = renderHook((props) => useGroupEdit(props), {
				initialProps: defaultOptions,
			});

			// Save to create local overrides
			await act(async () => {
				await result.current.handleEditKeyConfirm("validKey");
			});

			act(() => {
				result.current.setEditedName("Saved Name");
			});

			await act(async () => {
				await result.current.handleSaveEdit();
			});

			expect(result.current.displayedGroupName).toBe("Saved Name");

			// Change groupInfo
			const newGroupInfo = {
				name: "New From Server",
				description: "New Description",
				version: 3,
			};

			rerender({ ...defaultOptions, groupInfo: newGroupInfo });

			// Local overrides should be cleared
			expect(result.current.displayedGroupName).toBe("New From Server");
		});
	});

	describe("setEditedName and setEditedDescription", () => {
		it("should update editedName", () => {
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			act(() => {
				result.current.setEditedName("New Name");
			});

			expect(result.current.editedName).toBe("New Name");
		});

		it("should update editedDescription", () => {
			const { result } = renderHook(() => useGroupEdit(defaultOptions));

			act(() => {
				result.current.setEditedDescription("New Description");
			});

			expect(result.current.editedDescription).toBe("New Description");
		});
	});
});
