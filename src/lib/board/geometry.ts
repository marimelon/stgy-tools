/**
 * Geometry calculation functions for board rendering
 * Pure calculation functions used by both client and server
 */

/**
 * Bounding box type
 */
export type BoundingBoxResult = {
	minX: number;
	minY: number;
	width: number;
	height: number;
};

/**
 * Calculate bounding rectangle of a cone (relative coordinates with center at origin)
 * Starting point is 12 o'clock direction (-90 degrees), expanding clockwise by the angle
 */
export function getConeBoundingBox(
	angle: number,
	radius: number,
): BoundingBoxResult {
	// Start: 12 o'clock direction (-90 degrees)
	// End: clockwise from start by angle amount
	const startAngle = -90; // 12 o'clock direction (degrees)
	const endAngle = -90 + angle; // clockwise by angle amount

	// Collect vertices: center(0,0), start point, end point
	// SVG coordinate system: x=cos(θ)*r, y=sin(θ)*r (Y-axis positive downward)
	const points: { x: number; y: number }[] = [
		{ x: 0, y: 0 },
		{
			x: Math.cos((startAngle * Math.PI) / 180) * radius,
			y: Math.sin((startAngle * Math.PI) / 180) * radius,
		},
		{
			x: Math.cos((endAngle * Math.PI) / 180) * radius,
			y: Math.sin((endAngle * Math.PI) / 180) * radius,
		},
	];

	// Add cardinal angles (0, 90, 180, -90 degrees, etc.) if within cone range
	const cardinalAngles = [-90, 0, 90, 180, 270];
	for (const deg of cardinalAngles) {
		if (deg > startAngle && deg < endAngle) {
			points.push({
				x: Math.cos((deg * Math.PI) / 180) * radius,
				y: Math.sin((deg * Math.PI) / 180) * radius,
			});
		}
	}

	const xs = points.map((p) => p.x);
	const ys = points.map((p) => p.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	return { minX, minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Calculate bounding rectangle of a donut cone (relative coordinates with center at origin)
 * Starting point is 12 o'clock direction (-90 degrees), expanding clockwise by the angle
 * Unlike cone, does not include center(0,0), only considers outer and inner arc points
 */
export function getDonutConeBoundingBox(
	angle: number,
	outerRadius: number,
	innerRadius: number,
): BoundingBoxResult {
	const startAngle = -90;
	const endAngle = -90 + angle;

	const points: { x: number; y: number }[] = [];

	// Outer arc start and end points
	points.push({
		x: Math.cos((startAngle * Math.PI) / 180) * outerRadius,
		y: Math.sin((startAngle * Math.PI) / 180) * outerRadius,
	});
	points.push({
		x: Math.cos((endAngle * Math.PI) / 180) * outerRadius,
		y: Math.sin((endAngle * Math.PI) / 180) * outerRadius,
	});

	// Inner arc start and end points
	points.push({
		x: Math.cos((startAngle * Math.PI) / 180) * innerRadius,
		y: Math.sin((startAngle * Math.PI) / 180) * innerRadius,
	});
	points.push({
		x: Math.cos((endAngle * Math.PI) / 180) * innerRadius,
		y: Math.sin((endAngle * Math.PI) / 180) * innerRadius,
	});

	// Add to both outer and inner arcs if cardinal angles are within range
	const cardinalAngles = [-90, 0, 90, 180, 270];
	for (const deg of cardinalAngles) {
		if (deg > startAngle && deg < endAngle) {
			points.push({
				x: Math.cos((deg * Math.PI) / 180) * outerRadius,
				y: Math.sin((deg * Math.PI) / 180) * outerRadius,
			});
			points.push({
				x: Math.cos((deg * Math.PI) / 180) * innerRadius,
				y: Math.sin((deg * Math.PI) / 180) * innerRadius,
			});
		}
	}

	const xs = points.map((p) => p.x);
	const ys = points.map((p) => p.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	return { minX, minY, width: maxX - minX, height: maxY - minY };
}
