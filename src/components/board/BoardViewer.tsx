import type { BoardData, BoardObject } from "@/lib/stgy";
import { BackgroundRenderer } from "./BackgroundRenderer";
import { ObjectRenderer } from "./ObjectRenderer";

/** ゲーム内キャンバスサイズ */
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 384;

interface BoardViewerProps {
	boardData: BoardData;
	scale?: number;
	showBoundingBox?: boolean;
	selectedIndex?: number | null;
	onSelectObject?: (index: number | null, object: BoardObject | null) => void;
}

export function BoardViewer({
	boardData,
	scale = 1,
	showBoundingBox = false,
	selectedIndex = null,
	onSelectObject,
}: BoardViewerProps) {
	const { backgroundId, objects } = boardData;

	// 表示するオブジェクトのみフィルタ（元のインデックスを保持）
	// SVGは後から描画したものが上に表示されるため、逆順で描画
	const visibleObjects = objects
		.map((obj, index) => ({ obj, index }))
		.filter(({ obj }) => obj.flags.visible)
		.reverse();

	const handleSelect = (index: number) => {
		onSelectObject?.(index, objects[index]);
	};

	const handleBackgroundClick = () => {
		onSelectObject?.(null, null);
	};

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: SVG element with click for deselection
		<svg
			width={CANVAS_WIDTH * scale}
			height={CANVAS_HEIGHT * scale}
			viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
			style={{ backgroundColor: "#1a1a1a" }}
			onClick={handleBackgroundClick}
			role="img"
			aria-label="Strategy Board Viewer"
		>
			<BackgroundRenderer
				backgroundId={backgroundId}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
			/>
			{visibleObjects.map(({ obj, index }) => (
				<ObjectRenderer
					key={index}
					object={obj}
					index={index}
					showBoundingBox={showBoundingBox}
					selected={selectedIndex === index}
					onSelect={handleSelect}
				/>
			))}
		</svg>
	);
}
