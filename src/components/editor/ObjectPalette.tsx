/**
 * オブジェクトパレットコンポーネント
 *
 * カテゴリ別にオブジェクトを表示し、クリックでボードに追加
 * カスタムテーマ対応のリッチなデザイン
 */

import { Bug, ChevronRight } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ObjectRenderer } from "@/components/board";
import { createDefaultObject, useEditor } from "@/lib/editor";
import { ObjectIds, ObjectNames } from "@/lib/stgy";

/** 非表示オブジェクト（CSVでFalse） - デバッグモード時のみ表示 */
const HIDDEN_OBJECTS: { name: string; ids: number[] } = {
	name: "デバッグ（非表示）",
	ids: [
		// フィールド（非表示）
		ObjectIds.CircleWhiteSolid, // 1: 円形白無地フィールド
		ObjectIds.CircleWhiteTile, // 2: 円形白タイルフィールド
		ObjectIds.CircleGraySolid, // 3: 円形グレー無地フィールド
		ObjectIds.SquareWhiteSolid, // 5: 四角形白無地フィールド
		ObjectIds.SquareWhiteTile, // 6: 四角形白タイルフィールド
		ObjectIds.SquareGraySolid, // 7: 四角形グレー無地フィールド
		// ロール（非表示）
		58, // DPS5
		59, // DPS6
		// エネミー（非表示）
		61, // エネミー小2
		63, // エネミー中2
		// 図形（非表示）
		104, // 図形：矢印右回り
		// グループ
		ObjectIds.Group, // 105: グループ
	],
};

/** オブジェクトカテゴリ */
const OBJECT_CATEGORIES: Record<string, { name: string; ids: number[] }> = {
	fields: {
		name: "フィールド",
		ids: [
			// 注意: CircleWhiteSolid, CircleWhiteTile, CircleGraySolid,
			// SquareWhiteSolid, SquareWhiteTile, SquareGraySolid は未使用 (CSV: False)
			ObjectIds.CircleCheck,
			ObjectIds.CircleGray,
			ObjectIds.SquareCheck,
			ObjectIds.SquareGray,
		],
	},
	attacks: {
		name: "攻撃範囲",
		ids: [
			ObjectIds.CircleAoE,
			ObjectIds.ConeAoE,
			ObjectIds.LineAoE,
			ObjectIds.Line,
			ObjectIds.DonutAoE,
			ObjectIds.Stack,
			ObjectIds.StackLine,
			ObjectIds.StackChain,
			ObjectIds.Proximity,
			ObjectIds.ProximityTarget,
			ObjectIds.Tankbuster,
			ObjectIds.KnockbackRadial,
			ObjectIds.KnockbackLine,
			ObjectIds.Block,
			ObjectIds.Gaze,
			ObjectIds.TargetMarker,
			ObjectIds.CircleAoEMoving,
			ObjectIds.Area1P,
			ObjectIds.Area2P,
			ObjectIds.Area3P,
			ObjectIds.Area4P,
		],
	},
	roles: {
		name: "ロール",
		ids: [
			ObjectIds.Tank,
			ObjectIds.Tank1,
			ObjectIds.Tank2,
			ObjectIds.Healer,
			ObjectIds.Healer1,
			ObjectIds.Healer2,
			ObjectIds.DPS,
			ObjectIds.DPS1,
			ObjectIds.DPS2,
			ObjectIds.DPS3,
			ObjectIds.DPS4,
			ObjectIds.MeleeDPS,
			ObjectIds.RangedDPS,
			ObjectIds.PhysicalRangedDPS,
			ObjectIds.MagicalRangedDPS,
			ObjectIds.PureHealer,
			ObjectIds.BarrierHealer,
		],
	},
	jobs: {
		name: "ジョブ",
		ids: [
			// タンク
			ObjectIds.Paladin,
			ObjectIds.Warrior,
			ObjectIds.DarkKnight,
			ObjectIds.Gunbreaker,
			// ヒーラー
			ObjectIds.WhiteMage,
			ObjectIds.Scholar,
			ObjectIds.Astrologian,
			ObjectIds.Sage,
			// 近接DPS
			ObjectIds.Monk,
			ObjectIds.Dragoon,
			ObjectIds.Ninja,
			ObjectIds.Samurai,
			ObjectIds.Reaper,
			ObjectIds.Viper,
			// 遠隔物理DPS
			ObjectIds.Bard,
			ObjectIds.Machinist,
			ObjectIds.Dancer,
			// 遠隔魔法DPS
			ObjectIds.BlackMage,
			ObjectIds.Summoner,
			ObjectIds.RedMage,
			ObjectIds.Pictomancer,
			ObjectIds.BlueMage,
		],
	},
	enemies: {
		name: "エネミー",
		ids: [ObjectIds.EnemySmall, ObjectIds.EnemyMedium, ObjectIds.EnemyLarge],
	},
	markers: {
		name: "マーカー",
		ids: [
			ObjectIds.Attack1,
			ObjectIds.Attack2,
			ObjectIds.Attack3,
			ObjectIds.Attack4,
			ObjectIds.Attack5,
			ObjectIds.Attack6,
			ObjectIds.Attack7,
			ObjectIds.Attack8,
			ObjectIds.Bind1,
			ObjectIds.Bind2,
			ObjectIds.Bind3,
			ObjectIds.Ignore1,
			ObjectIds.Ignore2,
			ObjectIds.Square,
			ObjectIds.Circle,
			ObjectIds.Plus,
			ObjectIds.Triangle,
		],
	},
	waymarks: {
		name: "フィールドマーカー",
		ids: [
			ObjectIds.WaymarkA,
			ObjectIds.WaymarkB,
			ObjectIds.WaymarkC,
			ObjectIds.WaymarkD,
			ObjectIds.Waymark1,
			ObjectIds.Waymark2,
			ObjectIds.Waymark3,
			ObjectIds.Waymark4,
		],
	},
	shapes: {
		name: "図形",
		ids: [
			ObjectIds.ShapeCircle,
			ObjectIds.ShapeCross,
			ObjectIds.ShapeTriangle,
			ObjectIds.ShapeSquare,
			ObjectIds.ShapeArrow,
			ObjectIds.ShapeRotation,
			ObjectIds.EmphasisCircle,
			ObjectIds.EmphasisCross,
			ObjectIds.EmphasisSquare,
			ObjectIds.EmphasisTriangle,
			ObjectIds.Clockwise,
			ObjectIds.CounterClockwise,
		],
	},
	other: {
		name: "その他",
		ids: [
			ObjectIds.Text,
			ObjectIds.Buff,
			ObjectIds.Debuff,
			ObjectIds.LockOnRed,
			ObjectIds.LockOnBlue,
			ObjectIds.LockOnPurple,
			ObjectIds.LockOnGreen,
		],
	},
};

/**
 * デバッグモードの状態を取得/保存
 */
function getDebugMode(): boolean {
	if (typeof window === "undefined") return false;
	return localStorage.getItem("debugObjectPalette") === "true";
}

function setDebugMode(enabled: boolean) {
	if (typeof window === "undefined") return;
	localStorage.setItem("debugObjectPalette", enabled ? "true" : "false");
}

/**
 * オブジェクトパレットコンポーネント
 */
export function ObjectPalette() {
	const { addObject } = useEditor();
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(["roles", "attacks"]),
	);
	const [debugMode, setDebugModeState] = useState(false);

	// 初期化時にlocalStorageからデバッグモードを読み込み
	useEffect(() => {
		setDebugModeState(getDebugMode());
	}, []);

	const toggleCategory = (category: string) => {
		setExpandedCategories((prev) => {
			const next = new Set(prev);
			if (next.has(category)) {
				next.delete(category);
			} else {
				next.add(category);
			}
			return next;
		});
	};

	const toggleDebugMode = () => {
		const newValue = !debugMode;
		setDebugModeState(newValue);
		setDebugMode(newValue);
	};

	const handleAddObject = (objectId: number) => {
		addObject(objectId);
	};

	return (
		<div
			className="panel h-full overflow-y-auto"
			style={{ background: "var(--color-bg-base)" }}
		>
			<div className="panel-header flex items-center justify-between">
				<h2 className="panel-title">オブジェクト</h2>
				{/* デバッグモードトグル */}
				<button
					type="button"
					onClick={toggleDebugMode}
					className={`p-1 rounded transition-colors ${
						debugMode
							? "text-amber-400 bg-amber-400/20"
							: "text-muted-foreground hover:text-foreground hover:bg-muted"
					}`}
					title={debugMode ? "デバッグモード: ON" : "デバッグモード: OFF"}
				>
					<Bug size={16} />
				</button>
			</div>

			<div className="p-2">
				{Object.entries(OBJECT_CATEGORIES).map(([key, { name, ids }]) => (
					<div key={key} className="mb-1">
						{/* カテゴリヘッダー */}
						<button
							type="button"
							onClick={() => toggleCategory(key)}
							className="category-header w-full"
						>
							<span>{name}</span>
							<ChevronRight
								size={14}
								className={`category-chevron ${expandedCategories.has(key) ? "expanded" : ""}`}
							/>
						</button>

						{/* カテゴリ内オブジェクト */}
						{expandedCategories.has(key) && (
							<div className="grid grid-cols-4 gap-1.5 mt-1.5 px-1 animate-slideIn">
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

				{/* デバッグモード時のみ非表示オブジェクトを表示 */}
				{debugMode && (
					<div className="mb-1">
						<button
							type="button"
							onClick={() => toggleCategory("_debug")}
							className="category-header w-full text-amber-400"
						>
							<span className="flex items-center gap-1">
								<Bug size={12} />
								{HIDDEN_OBJECTS.name}
							</span>
							<ChevronRight
								size={14}
								className={`category-chevron ${expandedCategories.has("_debug") ? "expanded" : ""}`}
							/>
						</button>

						{expandedCategories.has("_debug") && (
							<div className="grid grid-cols-4 gap-1.5 mt-1.5 px-1 animate-slideIn">
								{HIDDEN_OBJECTS.ids.map((objectId) => (
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

/** フィールドオブジェクトのID一覧 (表示用viewBox調整に使用) */
const FIELD_OBJECT_IDS = [
	// 注意: CircleWhiteSolid, CircleWhiteTile, CircleGraySolid,
	// SquareWhiteSolid, SquareWhiteTile, SquareGraySolid は未使用 (CSV: False)
	ObjectIds.CircleCheck,
	ObjectIds.CircleGray,
	ObjectIds.SquareCheck,
	ObjectIds.SquareGray,
];

/**
 * パレットアイテムコンポーネント
 */
function ObjectPaletteItem({
	objectId,
	onClick,
	isDebug = false,
}: {
	objectId: number;
	onClick: () => void;
	isDebug?: boolean;
}) {
	const [isHovered, setIsHovered] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});

	// フィールドオブジェクトかどうかでviewBoxを調整
	const isFieldObject = (FIELD_OBJECT_IDS as number[]).includes(objectId);

	// 256pxサイズの範囲攻撃オブジェクト
	const isLargeAoE = (
		[
			ObjectIds.CircleAoE,
			ObjectIds.KnockbackRadial,
			ObjectIds.KnockbackLine,
		] as number[]
	).includes(objectId);

	// 134pxサイズの範囲攻撃オブジェクト
	const isMediumAoE = (
		[ObjectIds.CircleAoEMoving, ObjectIds.StackChain] as number[]
	).includes(objectId);

	// viewBoxサイズを決定（オブジェクトサイズに合わせて調整）
	const viewBoxSize =
		isFieldObject || isLargeAoE ? 280 : isMediumAoE ? 150 : 40;
	const objectPos = viewBoxSize / 2;

	const object = createDefaultObject(objectId, { x: objectPos, y: objectPos });
	const name = ObjectNames[objectId] ?? `ID: ${objectId}`;

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData("application/x-object-id", String(objectId));
		e.dataTransfer.effectAllowed = "copy";
	};

	// ツールチップ位置の計算
	useEffect(() => {
		if (isHovered && buttonRef.current && tooltipRef.current) {
			const buttonRect = buttonRef.current.getBoundingClientRect();
			const tooltipRect = tooltipRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;

			// ツールチップの中央位置
			let left = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2;

			// 左端からはみ出す場合
			if (left < 8) {
				left = 8;
			}
			// 右端からはみ出す場合
			if (left + tooltipRect.width > viewportWidth - 8) {
				left = viewportWidth - tooltipRect.width - 8;
			}

			setTooltipStyle({
				position: "fixed",
				left: `${left}px`,
				top: `${buttonRect.top - tooltipRect.height - 8}px`,
			});
		}
	}, [isHovered]);

	return (
		<div className="relative">
			<button
				ref={buttonRef}
				type="button"
				onClick={onClick}
				draggable
				onDragStart={handleDragStart}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onFocus={() => setIsHovered(true)}
				onBlur={() => setIsHovered(false)}
				className="palette-item w-full"
				aria-label={name}
			>
				<svg
					width={40}
					height={40}
					viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
					aria-hidden="true"
					style={{
						background: "var(--color-bg-deep)",
						borderRadius: "var(--radius-sm)",
						pointerEvents: "none",
						border: isDebug ? "2px solid #f59e0b" : undefined,
					}}
				>
					<ObjectRenderer
						object={object}
						index={0}
						showBoundingBox={false}
						selected={false}
					/>
				</svg>
			</button>
			{/* カスタムツールチップ */}
			{isHovered && (
				<div
					ref={tooltipRef}
					className="z-50 pointer-events-none"
					style={tooltipStyle}
					role="tooltip"
				>
					<div className="px-2 py-1 text-xs font-medium bg-popover text-popover-foreground border border-border rounded-md shadow-md whitespace-nowrap">
						{name}
					</div>
				</div>
			)}
		</div>
	);
}
