/**
 * オブジェクトパレットコンポーネント
 *
 * カテゴリ別にオブジェクトを表示し、クリックでボードに追加
 * カスタムテーマ対応のリッチなデザイン
 */

import { Bug, ChevronRight } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ObjectRenderer } from "@/components/board";
import { DEFAULT_BBOX_SIZE, OBJECT_BBOX_SIZES } from "@/lib/board";
import {
	createDefaultObject,
	useDebugMode,
	useEditor,
	useObjectPaletteState,
} from "@/lib/editor";
import { ObjectIds } from "@/lib/stgy";

/** 非表示オブジェクト（CSVでFalse） - デバッグモード時のみ表示 */
const HIDDEN_OBJECT_IDS: number[] = [
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
];

/** オブジェクトカテゴリ（キーはi18nのcategory.*に対応） */
/** オブジェクトカテゴリ（CSVの表示順序に準拠）
 * TofuObjectCategory.ja.csv カラム1でソート:
 * 1. クラス/ジョブ (カテゴリ2, カラム1: 1)
 * 2. 攻撃範囲 (カテゴリ6, カラム1: 2)
 * 3. アイコン/マーカー (カテゴリ3, カラム1: 3)
 * 4. 図形/記号 (カテゴリ4, カラム1: 4)
 * 5. フィールド (カテゴリ1, カラム1: 5)
 *
 * 各カテゴリ内はTofuObject.ja.csv カラム4でソート
 */
const OBJECT_CATEGORIES: Record<string, number[]> = {
	// カテゴリ2: クラス/ジョブ (カラム1: 1) - カラム3（ソート順）でソート
	jobs: [
		// ロールアイコン (ソート順 1-17)
		ObjectIds.Tank, // 1
		ObjectIds.Tank1, // 2
		ObjectIds.Tank2, // 3
		ObjectIds.Healer, // 4
		ObjectIds.Healer1, // 5
		ObjectIds.Healer2, // 6
		ObjectIds.PureHealer, // 7
		ObjectIds.BarrierHealer, // 8
		ObjectIds.DPS, // 9
		ObjectIds.DPS1, // 10
		ObjectIds.DPS2, // 11
		ObjectIds.DPS3, // 12
		ObjectIds.DPS4, // 13
		ObjectIds.MeleeDPS, // 14
		ObjectIds.RangedDPS, // 15
		ObjectIds.PhysicalRangedDPS, // 16
		ObjectIds.MagicalRangedDPS, // 17
		// タンクジョブ (ソート順 20-23)
		ObjectIds.Paladin, // 20
		ObjectIds.Warrior, // 21
		ObjectIds.DarkKnight, // 22
		ObjectIds.Gunbreaker, // 23
		// ヒーラージョブ (ソート順 30-33)
		ObjectIds.WhiteMage, // 30
		ObjectIds.Scholar, // 31
		ObjectIds.Astrologian, // 32
		ObjectIds.Sage, // 33
		// 近接DPSジョブ (ソート順 40-45)
		ObjectIds.Monk, // 40
		ObjectIds.Dragoon, // 41
		ObjectIds.Ninja, // 42
		ObjectIds.Samurai, // 43
		ObjectIds.Reaper, // 44
		ObjectIds.Viper, // 45
		// 遠隔物理DPSジョブ (ソート順 50-52)
		ObjectIds.Bard, // 50
		ObjectIds.Machinist, // 51
		ObjectIds.Dancer, // 52
		// 遠隔魔法DPSジョブ (ソート順 60-63)
		ObjectIds.BlackMage, // 60
		ObjectIds.Summoner, // 61
		ObjectIds.RedMage, // 62
		ObjectIds.Pictomancer, // 63
		// 青魔道士 (ソート順 70)
		ObjectIds.BlueMage, // 70
		// 基本クラス (ソート順 200-208)
		ObjectIds.Gladiator, // 200
		ObjectIds.Marauder, // 201
		ObjectIds.Conjurer, // 202
		ObjectIds.Pugilist, // 203
		ObjectIds.Lancer, // 204
		ObjectIds.Rogue, // 205
		ObjectIds.Archer, // 206
		ObjectIds.Thaumaturge, // 207
		ObjectIds.Arcanist, // 208
	],
	// カテゴリ6: 攻撃範囲 (カラム1: 2) - カラム4でソート
	attacks: [
		ObjectIds.CircleAoE, // 101
		ObjectIds.ConeAoE, // 102
		ObjectIds.LineAoE, // 103
		ObjectIds.Gaze, // 105
		ObjectIds.Stack, // 106
		ObjectIds.StackLine, // 107
		ObjectIds.Proximity, // 108
		ObjectIds.DonutAoE, // 109
		ObjectIds.StackChain, // 110
		ObjectIds.ProximityTarget, // 111
		ObjectIds.Tankbuster, // 112
		ObjectIds.KnockbackRadial, // 113
		ObjectIds.KnockbackLine, // 114
		ObjectIds.Block, // 115
		ObjectIds.TargetMarker, // 116
		ObjectIds.CircleAoEMoving, // 117
		ObjectIds.Area1P, // 118
		ObjectIds.Area2P, // 119
		ObjectIds.Area3P, // 120
		ObjectIds.Area4P, // 121
	],
	// カテゴリ3: アイコン/マーカー (カラム1: 3)
	markers: [
		// エネミー
		ObjectIds.EnemySmall,
		ObjectIds.EnemyMedium,
		ObjectIds.EnemyLarge,
		// バフ/デバフ
		ObjectIds.Buff,
		ObjectIds.Debuff,
		// 攻撃マーカー
		ObjectIds.Attack1,
		ObjectIds.Attack2,
		ObjectIds.Attack3,
		ObjectIds.Attack4,
		ObjectIds.Attack5,
		ObjectIds.Attack6,
		ObjectIds.Attack7,
		ObjectIds.Attack8,
		// 足止め/禁止
		ObjectIds.Bind1,
		ObjectIds.Bind2,
		ObjectIds.Bind3,
		ObjectIds.Ignore1,
		ObjectIds.Ignore2,
		// 汎用マーカー
		ObjectIds.Square,
		ObjectIds.Circle,
		ObjectIds.Plus,
		ObjectIds.Triangle,
		// フィールドマーカー
		ObjectIds.WaymarkA,
		ObjectIds.WaymarkB,
		ObjectIds.WaymarkC,
		ObjectIds.WaymarkD,
		ObjectIds.Waymark1,
		ObjectIds.Waymark2,
		ObjectIds.Waymark3,
		ObjectIds.Waymark4,
		// ロックオンマーカー
		ObjectIds.LockOnRed,
		ObjectIds.LockOnBlue,
		ObjectIds.LockOnPurple,
		ObjectIds.LockOnGreen,
	],
	// カテゴリ4: 図形/記号 (カラム1: 4)
	shapes: [
		ObjectIds.Text,
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
		ObjectIds.Line,
	],
	// カテゴリ1: フィールド (カラム1: 5)
	fields: [
		// 注意: CircleWhiteSolid, CircleWhiteTile, CircleGraySolid,
		// SquareWhiteSolid, SquareWhiteTile, SquareGraySolid は未使用 (CSV: False)
		ObjectIds.CircleCheck,
		ObjectIds.SquareCheck,
		ObjectIds.CircleGray,
		ObjectIds.SquareGray,
	],
};

/**
 * オブジェクトパレットコンポーネント
 */
export function ObjectPalette() {
	const { t } = useTranslation();
	const { addObject } = useEditor();
	const { debugMode, toggleDebugMode } = useDebugMode();
	const { expandedCategories, toggleCategory } = useObjectPaletteState();

	const handleAddObject = (objectId: number) => {
		addObject(objectId);
	};

	return (
		<div
			className="panel h-full overflow-y-auto"
			style={{ background: "var(--color-bg-base)" }}
		>
			<div className="panel-header flex items-center justify-between">
				<h2 className="panel-title">{t("objectPalette.title")}</h2>
				{/* デバッグモードトグル */}
				<button
					type="button"
					onClick={toggleDebugMode}
					className={`p-1 rounded transition-colors ${
						debugMode
							? "text-amber-400 bg-amber-400/20"
							: "text-muted-foreground hover:text-foreground hover:bg-muted"
					}`}
					title={`${t("objectPalette.debugMode")}: ${debugMode ? "ON" : "OFF"}`}
				>
					<Bug size={16} />
				</button>
			</div>

			<div className="p-2">
				{Object.entries(OBJECT_CATEGORIES).map(([key, ids]) => (
					<div key={key} className="mb-1">
						{/* カテゴリヘッダー */}
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

						{/* カテゴリ内オブジェクト */}
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

/** パレット専用アイコンがあるオブジェクトID一覧 */
const PALETTE_ICON_OBJECT_IDS: number[] = [
	ObjectIds.ConeAoE, // 10: 扇範囲攻撃
	ObjectIds.Line, // 12: ライン
	ObjectIds.DonutAoE, // 17: 輪形範囲攻撃
	ObjectIds.Text, // 100: テキスト
];

/**
 * オブジェクトのviewBoxサイズを取得（実サイズ + 余白）
 */
function getViewBoxSize(objectId: number): number {
	const size = OBJECT_BBOX_SIZES[objectId] ?? DEFAULT_BBOX_SIZE;
	const maxDimension = Math.max(size.width, size.height);
	// 余白を追加してオブジェクトが見切れないようにする
	return Math.ceil(maxDimension * 1.1);
}

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
	const { t } = useTranslation();
	const [isHovered, setIsHovered] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});

	// オブジェクトサイズに基づいてviewBoxサイズを計算
	const viewBoxSize = getViewBoxSize(objectId);
	const objectPos = viewBoxSize / 2;

	const object = createDefaultObject(objectId, { x: objectPos, y: objectPos });
	const name = t(`object.${objectId}`, { defaultValue: `ID: ${objectId}` });

	// パレット専用アイコンがあるかどうか
	const hasPaletteIcon = PALETTE_ICON_OBJECT_IDS.includes(objectId);

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
				className="palette-item"
				aria-label={name}
			>
				{hasPaletteIcon ? (
					<img
						src={`/palette-icons/${objectId}.png`}
						alt=""
						aria-hidden="true"
						style={{
							width: "40px",
							height: "40px",
							display: "block",
							background: "var(--color-bg-deep)",
							borderRadius: "var(--radius-sm)",
							pointerEvents: "none",
							border: isDebug ? "2px solid #f59e0b" : undefined,
							objectFit: "contain",
						}}
					/>
				) : (
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
				)}
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
