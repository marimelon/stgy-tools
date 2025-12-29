/**
 * スクリーンショットアップロードコンポーネント
 */

import { ImagePlus, Upload } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScreenshotUploaderProps {
	onFileSelect: (file: File) => void;
	onLoadSample: () => void;
	currentFileName: string | null;
}

export function ScreenshotUploader({
	onFileSelect,
	onLoadSample,
	currentFileName,
}: ScreenshotUploaderProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const inputId = useId();
	const [isDragging, setIsDragging] = useState(false);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				onFileSelect(file);
			}
		},
		[onFileSelect],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files?.[0];
			if (file?.type.startsWith("image/")) {
				onFileSelect(file);
			}
		},
		[onFileSelect],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleClick = useCallback(() => {
		inputRef.current?.click();
	}, []);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label htmlFor={inputId}>Screenshot</Label>
				<Button variant="outline" size="sm" onClick={onLoadSample}>
					<ImagePlus className="size-4 mr-1" />
					Load Sample
				</Button>
			</div>

			{/* biome-ignore lint/a11y/useSemanticElements: Drop zone needs custom styling */}
			<div
				className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
					isDragging
						? "border-primary bg-primary/10"
						: "border-border hover:border-primary/50"
				}`}
				onClick={handleClick}
				onKeyDown={(e) => e.key === "Enter" && handleClick()}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				role="button"
				tabIndex={0}
			>
				<Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
				<p className="text-sm text-muted-foreground">
					Drop screenshot here or click to select
				</p>
				{currentFileName && (
					<p className="text-xs text-foreground mt-2 font-mono">
						{currentFileName}
					</p>
				)}
			</div>

			<Input
				ref={inputRef}
				id={inputId}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
			/>
		</div>
	);
}
