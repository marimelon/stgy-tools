/**
 * Inline text editor component for double-click text editing
 */

import { useEffect, useRef, useState } from "react";
import { useDebugMode } from "@/lib/settings";
import type { BoardObject } from "@/lib/stgy";
import { MAX_TEXT_BYTES, truncateToUtf8Bytes } from "@/lib/stgy";

interface InlineTextEditorProps {
	object: BoardObject;
	onEndEdit: (save: boolean, text?: string) => void;
}
export function InlineTextEditor({ object, onEndEdit }: InlineTextEditorProps) {
	const debugMode = useDebugMode();
	const [text, setText] = useState(object.text ?? "");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// Focus on next frame to wait for foreignObject rendering
		requestAnimationFrame(() => {
			inputRef.current?.focus();
			inputRef.current?.select();
		});
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		// Ignore during IME composition
		if (e.nativeEvent.isComposing) return;

		if (e.key === "Enter") {
			e.preventDefault();
			onEndEdit(true, text);
		} else if (e.key === "Escape") {
			e.preventDefault();
			onEndEdit(false);
		}
	};

	const handleBlur = () => {
		onEndEdit(true, text);
	};

	const fontSize = 14 * (object.size / 100);
	const estimatedWidth = Math.max(120, text.length * fontSize * 0.7 + 40);
	const height = fontSize + 16;

	// Treat opacity 0 as fully opaque
	const textOpacity =
		object.color.opacity === 0 ? 1 : object.color.opacity / 100;
	const textColor = `rgba(${object.color.r}, ${object.color.g}, ${object.color.b}, ${textOpacity})`;

	return (
		<foreignObject
			x={object.position.x - estimatedWidth / 2}
			y={object.position.y - height / 2}
			width={estimatedWidth}
			height={height}
			transform={`rotate(${object.rotation} ${object.position.x} ${object.position.y})`}
			style={{ overflow: "visible" }}
		>
			<input
				ref={inputRef}
				type="text"
				value={text}
				onChange={(e) => {
					let newText = e.target.value;
					// Limit to 30 bytes unless in debug mode
					if (!debugMode) {
						newText = truncateToUtf8Bytes(newText, MAX_TEXT_BYTES);
					}
					setText(newText);
				}}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
				style={{
					width: "100%",
					height: "100%",
					textAlign: "center",
					border: "2px solid #22d3ee",
					borderRadius: "4px",
					backgroundColor: "rgba(30, 41, 59, 0.95)",
					outline: "none",
					padding: "0 8px",
					fontSize: `${fontSize}px`,
					color: textColor,
					boxSizing: "border-box",
				}}
			/>
		</foreignObject>
	);
}
