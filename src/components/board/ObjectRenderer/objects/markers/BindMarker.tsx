import { useId } from "react";
import { ObjectIds } from "@/lib/stgy";

export function BindMarkerIcon({
	objectId,
	transform,
}: {
	objectId: number;
	transform: string;
}) {
	const id = useId();
	const glowId = `bindMarkerGlow-${id}`;

	// 数字を取得
	const numberMap: Record<number, number> = {
		[ObjectIds.Bind1]: 1,
		[ObjectIds.Bind2]: 2,
		[ObjectIds.Bind3]: 3,
	};
	const num = numberMap[objectId] ?? 1;

	// 楕円形のチェーンリンク（縦長の楕円）
	const rx = 8; // 横の半径
	const ry = 12; // 縦の半径

	return (
		<g transform={transform}>
			{/* 透明な背景（クリック領域） */}
			<rect x={-20} y={-30} width={44} height={64} fill="transparent" />
			<defs>
				<filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="1.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			{/* グロー効果 */}
			<g filter={`url(#${glowId})`} opacity="0.5">
				<ellipse
					cx={-4}
					cy={-14}
					rx={rx}
					ry={ry}
					fill="none"
					stroke="#bb77dd"
					strokeWidth="6"
				/>
				<ellipse
					cx={4}
					cy={0}
					rx={rx}
					ry={ry}
					fill="none"
					stroke="#bb77dd"
					strokeWidth="6"
				/>
				<ellipse
					cx={-4}
					cy={14}
					rx={rx}
					ry={ry}
					fill="none"
					stroke="#bb77dd"
					strokeWidth="6"
				/>
			</g>

			{/* リンク1（上）- 外側の白い縁 */}
			<ellipse
				cx={-4}
				cy={-14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#ffffff"
				strokeWidth="3"
			/>
			{/* リンク1 - 内側の紫 */}
			<ellipse
				cx={-4}
				cy={-14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#9955bb"
				strokeWidth="1.5"
			/>

			{/* リンク2（中央）- 外側の白い縁 */}
			<ellipse
				cx={4}
				cy={0}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#ffffff"
				strokeWidth="3"
			/>
			{/* リンク2 - 内側の紫 */}
			<ellipse
				cx={4}
				cy={0}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#9955bb"
				strokeWidth="1.5"
			/>

			{/* リンク3（下）- 外側の白い縁 */}
			<ellipse
				cx={-4}
				cy={14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#ffffff"
				strokeWidth="3"
			/>
			{/* リンク3 - 内側の紫 */}
			<ellipse
				cx={-4}
				cy={14}
				rx={rx}
				ry={ry}
				fill="none"
				stroke="#9955bb"
				strokeWidth="1.5"
			/>

			{/* 数字 */}
			<text
				x={16}
				y={-16}
				textAnchor="middle"
				dominantBaseline="middle"
				fill="#ffffff"
				fontSize="14"
				fontWeight="bold"
				fontFamily="Arial, sans-serif"
			>
				{num}
			</text>
		</g>
	);
}
