/**
 * 図形関連のアイコンコンポーネント
 */

import type { IconProps } from "./types";

/** 図形マルアイコン（二重円） */
export function ShapeCircleIcon({ transform }: IconProps) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";
	const outerRadius = 24;
	const innerRadius = 18;

	const donutPath = `
		M ${outerRadius} 0
		A ${outerRadius} ${outerRadius} 0 1 0 ${-outerRadius} 0
		A ${outerRadius} ${outerRadius} 0 1 0 ${outerRadius} 0
		Z
		M ${innerRadius} 0
		A ${innerRadius} ${innerRadius} 0 1 1 ${-innerRadius} 0
		A ${innerRadius} ${innerRadius} 0 1 1 ${innerRadius} 0
		Z
	`;

	return (
		<g transform={transform}>
			<path d={donutPath} fill={fillColor} stroke={strokeColor} strokeWidth="2" fillRule="evenodd" />
		</g>
	);
}

/** 図形バツアイコン（X形状） */
export function ShapeCrossIcon({ transform }: IconProps) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";
	const size = 22;
	const width = 6;

	const crossPath = `
		M ${-size} ${-size + width}
		L ${-size + width} ${-size}
		L 0 ${-width}
		L ${size - width} ${-size}
		L ${size} ${-size + width}
		L ${width} 0
		L ${size} ${size - width}
		L ${size - width} ${size}
		L 0 ${width}
		L ${-size + width} ${size}
		L ${-size} ${size - width}
		L ${-width} 0
		Z
	`;

	return (
		<g transform={transform}>
			<path d={crossPath} fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
		</g>
	);
}

/** 図形シカクアイコン（二重四角形） */
export function ShapeSquareIcon({ transform }: IconProps) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";
	const outerSize = 22;
	const innerSize = 16;

	const doublePath = `
		M ${-outerSize} ${-outerSize}
		L ${outerSize} ${-outerSize}
		L ${outerSize} ${outerSize}
		L ${-outerSize} ${outerSize}
		Z
		M ${-innerSize} ${-innerSize}
		L ${-innerSize} ${innerSize}
		L ${innerSize} ${innerSize}
		L ${innerSize} ${-innerSize}
		Z
	`;

	return (
		<g transform={transform}>
			<path d={doublePath} fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" fillRule="evenodd" />
		</g>
	);
}

/** 図形サンカクアイコン（二重三角形） */
export function ShapeTriangleIcon({ transform }: IconProps) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";

	const doublePath = `
		M 0 -24
		L 22 20
		L -22 20
		Z
		M 0 -16
		L -15 14
		L 15 14
		Z
	`;

	return (
		<g transform={transform}>
			<path d={doublePath} fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" fillRule="evenodd" />
		</g>
	);
}

/** 図形ヤジルシアイコン（上向き矢印） */
export function ShapeArrowIcon({ transform }: IconProps) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";

	const arrowPath = `
		M 0 -26
		L 18 6
		L 8 6
		L 8 26
		L -8 26
		L -8 6
		L -18 6
		Z
	`;

	return (
		<g transform={transform}>
			<path d={arrowPath} fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
		</g>
	);
}

/** 図形カイテンアイコン（回転矢印） */
export function ShapeRotationIcon({ transform }: IconProps) {
	const strokeColor = "#ccaa44";
	const fillColor = "#ffffff";
	const outerRadius = 22;
	const innerRadius = 16;

	const startAngle = -135;
	const endAngle = 135;
	const startRad = (startAngle * Math.PI) / 180;
	const endRad = (endAngle * Math.PI) / 180;

	const outerX1 = Math.cos(startRad) * outerRadius;
	const outerY1 = Math.sin(startRad) * outerRadius;
	const outerX2 = Math.cos(endRad) * outerRadius;
	const outerY2 = Math.sin(endRad) * outerRadius;

	const innerX1 = Math.cos(startRad) * innerRadius;
	const innerY1 = Math.sin(startRad) * innerRadius;
	const innerX2 = Math.cos(endRad) * innerRadius;
	const innerY2 = Math.sin(endRad) * innerRadius;

	const arrowTipX = outerX2 + 8;
	const midRadius = (outerRadius + innerRadius) / 2;
	const midY = Math.sin(endRad) * midRadius;

	const arcPath = `
		M ${outerX1} ${outerY1}
		A ${outerRadius} ${outerRadius} 0 1 1 ${outerX2} ${outerY2}
		L ${arrowTipX} ${midY}
		L ${innerX2} ${innerY2}
		A ${innerRadius} ${innerRadius} 0 1 0 ${innerX1} ${innerY1}
		Z
	`;

	return (
		<g transform={transform}>
			<path d={arcPath} fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
		</g>
	);
}

