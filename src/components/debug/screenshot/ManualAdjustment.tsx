/**
 * Manual adjustment component
 */

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { ManualAdjustment as ManualAdjustmentType } from "@/lib/screenshot/types";

interface ManualAdjustmentProps {
	adjustment: ManualAdjustmentType;
	onChange: (adjustment: ManualAdjustmentType) => void;
	imageWidth: number;
	imageHeight: number;
}

export function ManualAdjustment({
	adjustment,
	onChange,
	imageWidth,
	imageHeight,
}: ManualAdjustmentProps) {
	const maxOffset = Math.max(imageWidth, imageHeight) / 2;

	const handleReset = () => {
		onChange({ offsetX: 0, offsetY: 0, scale: 1.0 });
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-medium">Manual Adjustment</h3>
				<Button variant="ghost" size="sm" onClick={handleReset}>
					<RotateCcw className="size-4 mr-1" />
					Reset
				</Button>
			</div>

			<div className="space-y-3">
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label className="text-xs">Offset X</Label>
						<span className="text-xs font-mono text-muted-foreground">
							{adjustment.offsetX.toFixed(0)}px
						</span>
					</div>
					<Slider
						value={[adjustment.offsetX]}
						onValueChange={([value]) =>
							onChange({ ...adjustment, offsetX: value })
						}
						min={-maxOffset}
						max={maxOffset}
						step={1}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label className="text-xs">Offset Y</Label>
						<span className="text-xs font-mono text-muted-foreground">
							{adjustment.offsetY.toFixed(0)}px
						</span>
					</div>
					<Slider
						value={[adjustment.offsetY]}
						onValueChange={([value]) =>
							onChange({ ...adjustment, offsetY: value })
						}
						min={-maxOffset}
						max={maxOffset}
						step={1}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label className="text-xs">Scale</Label>
						<span className="text-xs font-mono text-muted-foreground">
							{(adjustment.scale * 100).toFixed(0)}%
						</span>
					</div>
					<Slider
						value={[adjustment.scale]}
						onValueChange={([value]) =>
							onChange({ ...adjustment, scale: value })
						}
						min={0.5}
						max={2.0}
						step={0.01}
					/>
				</div>
			</div>
		</div>
	);
}
