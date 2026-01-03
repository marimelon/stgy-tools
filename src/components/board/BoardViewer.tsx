import type { BoardData, BoardObject } from "@/lib/stgy";
import { BackgroundRenderer } from "./BackgroundRenderer";
import { ObjectRenderer } from "./ObjectRenderer";

/** ゲーム内キャンバスサイズ */
export const CANVAS_WIDTH = 512;
export const CANVAS_HEIGHT = 384;

interface BoardViewerProps {
	boardData: BoardData;
	/** 固定スケール（responsiveがfalseの場合に使用） */
	scale?: number;
	/** trueの場合、コンテナ幅に合わせて自動スケール */
	responsive?: boolean;
	/** レスポンシブモード時の最大幅（デフォルト: CANVAS_WIDTH） */
	maxWidth?: number;
	selectedObjectId?: string | null;
	onSelectObject?: (
		objectId: string | null,
		object: BoardObject | null,
	) => void;
}

export function BoardViewer({
	boardData,
	scale = 1,
	responsive = false,
	maxWidth,
	selectedObjectId = null,
	onSelectObject,
}: BoardViewerProps) {
	const { backgroundId, objects } = boardData;

	// 表示するオブジェクトのみフィルタ
	// SVGは後から描画したものが上に表示されるため、逆順で描画
	const visibleObjects = objects.filter((obj) => obj.flags.visible).reverse();

	const handleSelect = (objectId: string) => {
		const obj = objects.find((o) => o.id === objectId);
		onSelectObject?.(objectId, obj ?? null);
	};

	const handleBackgroundClick = () => {
		onSelectObject?.(null, null);
	};

	// レスポンシブモード: コンテナ幅に合わせて自動スケール
	// 固定モード: scale値で固定サイズ
	const effectiveMaxWidth = maxWidth ?? CANVAS_WIDTH;
	const svgProps = responsive
		? {
				width: "100%",
				style: { backgroundColor: "#1a1a1a", maxWidth: effectiveMaxWidth },
			}
		: {
				width: CANVAS_WIDTH * scale,
				height: CANVAS_HEIGHT * scale,
				style: { backgroundColor: "#1a1a1a" },
			};

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: SVG element with click for deselection
		<svg
			{...svgProps}
			viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
			onClick={handleBackgroundClick}
			role="img"
			aria-label="Strategy Board Viewer"
		>
			<BackgroundRenderer
				backgroundId={backgroundId}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
			/>
			{visibleObjects.map((obj) => (
				<ObjectRenderer
					key={obj.id}
					object={obj}
					selected={selectedObjectId === obj.id}
					onSelect={handleSelect}
				/>
			))}
		</svg>
	);
}
