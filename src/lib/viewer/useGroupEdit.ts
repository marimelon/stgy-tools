import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	deleteGroupFn,
	updateGroupFn,
	verifyGroupEditKeyFn,
} from "@/lib/server/shortLinks/serverFn";

export interface GroupInfo {
	name: string;
	description?: string;
	version?: number;
	currentVersion?: number;
	isPastVersion?: boolean;
	versionNotFound?: boolean;
}

interface UseGroupEditOptions {
	groupId: string | undefined;
	groupInfo: GroupInfo | undefined;
	stgyCodes: string[];
	onSaveSuccess: (newStgyCodes: string[]) => void;
	onCancelReset: () => string[];
}

export function useGroupEdit({
	groupId,
	groupInfo,
	stgyCodes,
	onSaveSuccess,
	onCancelReset,
}: UseGroupEditOptions) {
	const { t } = useTranslation();

	// Edit mode state
	const [isEditMode, setIsEditMode] = useState(false);
	const [editKey, setEditKey] = useState<string | null>(null);
	const [editedName, setEditedName] = useState(groupInfo?.name ?? "");
	const [editedDescription, setEditedDescription] = useState(
		groupInfo?.description ?? "",
	);
	const [isUpdating, setIsUpdating] = useState(false);
	const [updateError, setUpdateError] = useState<string | null>(null);

	// Delete state
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	// Dialog states
	const [isEditKeyDialogOpen, setIsEditKeyDialogOpen] = useState(false);
	const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// Version state
	const [groupVersion, setGroupVersion] = useState(groupInfo?.version);

	// Local overrides for group info after save (to avoid full reload)
	const [savedGroupName, setSavedGroupName] = useState<string | null>(null);
	const [savedGroupDescription, setSavedGroupDescription] = useState<
		string | null
	>(null);

	// Displayed group info (local override takes precedence)
	const displayedGroupName = savedGroupName ?? groupInfo?.name ?? "";
	const displayedGroupDescription =
		savedGroupDescription ?? groupInfo?.description;

	// Sync edit fields when groupInfo changes
	useEffect(() => {
		if (groupInfo) {
			setEditedName(groupInfo.name);
			setEditedDescription(groupInfo.description ?? "");
			setGroupVersion(groupInfo.version);
			setSavedGroupName(null);
			setSavedGroupDescription(null);
		}
	}, [groupInfo]);

	// Edit mode handlers
	const handleEditClick = useCallback(() => {
		if (editKey) {
			setIsEditMode(true);
		} else {
			setIsEditKeyDialogOpen(true);
		}
	}, [editKey]);

	const handleEditKeyConfirm = useCallback(
		async (key: string): Promise<boolean> => {
			if (!groupId) return false;

			try {
				const isValid = await verifyGroupEditKeyFn({
					data: { groupId, editKey: key },
				});

				if (isValid) {
					setEditKey(key);
					setIsEditMode(true);
					return true;
				}
				return false;
			} catch {
				return false;
			}
		},
		[groupId],
	);

	const handleCancelEdit = useCallback(() => {
		setIsEditMode(false);
		setUpdateError(null);
		setEditedName(displayedGroupName);
		setEditedDescription(displayedGroupDescription ?? "");
		onCancelReset();
	}, [displayedGroupName, displayedGroupDescription, onCancelReset]);

	const handleSaveEdit = useCallback(async () => {
		if (!groupId || !editKey || isUpdating) return;

		setIsUpdating(true);
		setUpdateError(null);
		try {
			const result = await updateGroupFn({
				data: {
					groupId,
					editKey,
					name: editedName,
					description: editedDescription || undefined,
					stgyCodes,
				},
			});

			if (result.success) {
				setGroupVersion(result.data.version);
				setIsEditMode(false);
				setUpdateError(null);
				setSavedGroupName(editedName);
				setSavedGroupDescription(editedDescription || null);
				onSaveSuccess(stgyCodes);
			} else {
				setUpdateError(t(`viewer.group.error.${result.code}`, result.error));
			}
		} catch {
			setUpdateError(t("viewer.group.error.STORAGE_ERROR"));
		} finally {
			setIsUpdating(false);
		}
	}, [
		groupId,
		editKey,
		editedName,
		editedDescription,
		stgyCodes,
		isUpdating,
		onSaveSuccess,
		t,
	]);

	// History handlers
	const handleHistoryClick = useCallback(() => {
		setIsHistoryDialogOpen(true);
	}, []);

	const handleViewVersion = useCallback(
		(version: { version: number }) => {
			if (!groupId) return;
			window.location.href = `/?g=${groupId}&v=${version.version}`;
		},
		[groupId],
	);

	const handleBackToCurrentVersion = useCallback(() => {
		if (!groupId) return;
		window.location.href = `/?g=${groupId}`;
	}, [groupId]);

	// Delete handlers
	const handleDeleteClick = useCallback(() => {
		setDeleteError(null);
		setIsDeleteDialogOpen(true);
	}, []);

	const handleDeleteDialogClose = useCallback((open: boolean) => {
		setIsDeleteDialogOpen(open);
		if (!open) {
			setDeleteError(null);
		}
	}, []);

	const handleDeleteGroup = useCallback(async () => {
		if (!groupId || !editKey) return;

		setIsDeleting(true);
		setDeleteError(null);
		try {
			const result = await deleteGroupFn({
				data: { groupId, editKey },
			});

			if (result.success) {
				setIsDeleteDialogOpen(false);
				window.location.href = "/";
			} else {
				setDeleteError(t(`viewer.group.error.${result.code}`, result.error));
			}
		} catch {
			setDeleteError(t("viewer.group.error.STORAGE_ERROR"));
		} finally {
			setIsDeleting(false);
		}
	}, [groupId, editKey, t]);

	return useMemo(
		() => ({
			// Edit state
			isEditMode,
			editedName,
			editedDescription,
			isUpdating,
			updateError,
			setEditedName,
			setEditedDescription,

			// Display state (with local overrides)
			displayedGroupName,
			displayedGroupDescription,
			groupVersion,

			// Edit handlers
			handleEditClick,
			handleEditKeyConfirm,
			handleCancelEdit,
			handleSaveEdit,

			// History
			handleHistoryClick,
			handleViewVersion,
			handleBackToCurrentVersion,

			// Delete
			isDeleting,
			deleteError,
			handleDeleteClick,
			handleDeleteDialogClose,
			handleDeleteGroup,

			// Dialog controls
			dialogs: {
				editKey: {
					isOpen: isEditKeyDialogOpen,
					setIsOpen: setIsEditKeyDialogOpen,
					onConfirm: handleEditKeyConfirm,
				},
				history: {
					isOpen: isHistoryDialogOpen,
					setIsOpen: setIsHistoryDialogOpen,
					onViewVersion: handleViewVersion,
				},
				delete: {
					isOpen: isDeleteDialogOpen,
					onOpenChange: handleDeleteDialogClose,
					onConfirm: handleDeleteGroup,
				},
			},
		}),
		[
			isEditMode,
			editedName,
			editedDescription,
			isUpdating,
			updateError,
			displayedGroupName,
			displayedGroupDescription,
			groupVersion,
			handleEditClick,
			handleEditKeyConfirm,
			handleCancelEdit,
			handleSaveEdit,
			handleHistoryClick,
			handleViewVersion,
			handleBackToCurrentVersion,
			isDeleting,
			deleteError,
			handleDeleteClick,
			handleDeleteDialogClose,
			handleDeleteGroup,
			isEditKeyDialogOpen,
			isHistoryDialogOpen,
			isDeleteDialogOpen,
		],
	);
}
