/**
 * Object palette component
 *
 * Display objects by category, click to add to board
 * Rich design with custom theme support
 */

import { Bug, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEditorActions, useObjectPaletteState } from "@/lib/editor";
import { useDebugMode } from "@/lib/settings";
import { HIDDEN_OBJECT_IDS, OBJECT_CATEGORIES } from "./categories";
import { ObjectPaletteItem } from "./ObjectPaletteItem";

export function ObjectPalette() {
	const { t } = useTranslation();
	const { addObjectById } = useEditorActions();
	const debugMode = useDebugMode();
	const { expandedCategories, toggleCategory } = useObjectPaletteState();

	const handleAddObject = (objectId: number) => {
		addObjectById(objectId);
	};

	return (
		<div
			className="h-full overflow-y-auto"
			style={{ background: "var(--color-bg-base)" }}
		>
			<div className="p-2">
				{Object.entries(OBJECT_CATEGORIES).map(([key, ids]) => (
					<div key={key} className="mb-1">
						{/* Category header */}
						<button
							type="button"
							onClick={() => toggleCategory(key)}
							className="category-header w-full"
						>
							<span>{t(`category.${key}`)}</span>
							<ChevronRight
								size={14}
								className={`category-chevron ${expandedCategories.has(key) ? "expanded" : ""}`}
							/>
						</button>

						{/* Objects in category */}
						{expandedCategories.has(key) && (
							<div className="palette-grid mt-1.5 px-1 animate-slideIn">
								{ids.map((objectId) => (
									<ObjectPaletteItem
										key={objectId}
										objectId={objectId}
										onClick={() => handleAddObject(objectId)}
									/>
								))}
							</div>
						)}
					</div>
				))}

				{/* Show hidden objects only in debug mode */}
				{debugMode && (
					<div className="mb-1">
						<button
							type="button"
							onClick={() => toggleCategory("_debug")}
							className="category-header w-full text-amber-400"
						>
							<span className="flex items-center gap-1">
								<Bug size={12} />
								{t("category.debug")}
							</span>
							<ChevronRight
								size={14}
								className={`category-chevron ${expandedCategories.has("_debug") ? "expanded" : ""}`}
							/>
						</button>

						{expandedCategories.has("_debug") && (
							<div className="palette-grid mt-1.5 px-1 animate-slideIn">
								{HIDDEN_OBJECT_IDS.map((objectId) => (
									<ObjectPaletteItem
										key={objectId}
										objectId={objectId}
										onClick={() => handleAddObject(objectId)}
										isDebug
									/>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
