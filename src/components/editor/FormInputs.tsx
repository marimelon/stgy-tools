/**
 * Form input components
 *
 * Property panel input components based on shadcn/ui
 */

import type { ReactNode } from "react";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function PropertySection({
	title,
	children,
	rightContent,
}: {
	title: string;
	children: ReactNode;
	rightContent?: ReactNode;
}) {
	return (
		<div className="mb-4">
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground font-display">
					{title}
				</span>
				{rightContent && (
					<span className="text-xs text-muted-foreground">{rightContent}</span>
				)}
			</div>
			{children}
		</div>
	);
}

export interface NumberInputProps {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
	onBlur?: () => void;
}

export function NumberInput({
	label,
	value,
	min,
	max,
	step,
	onChange,
	onBlur,
}: NumberInputProps) {
	return (
		<div className="space-y-1">
			<Label className="text-xs text-muted-foreground">{label}</Label>
			<Input
				type="number"
				value={Math.round(value * 10) / 10}
				min={min}
				max={max}
				step={step}
				onChange={(e) => onChange(Number(e.target.value))}
				onBlur={onBlur}
				className="font-mono"
			/>
		</div>
	);
}

export interface SliderInputProps {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	unit?: string;
	onChange: (value: number) => void;
	onBlur?: () => void;
}

export function SliderInput({
	label,
	value,
	min,
	max,
	step,
	unit,
	onChange,
	onBlur,
}: SliderInputProps) {
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const inputValue = e.target.value;
		if (inputValue === "" || inputValue === "-") {
			return;
		}
		const numValue = Number(inputValue);
		if (!Number.isNaN(numValue)) {
			const clampedValue = Math.min(max, Math.max(min, numValue));
			onChange(clampedValue);
		}
	};

	const handleInputBlur = () => {
		onBlur?.();
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-2">
				{label && (
					<Label className="text-xs text-muted-foreground">{label}</Label>
				)}
				<div className="flex items-center gap-1">
					<Input
						type="number"
						value={Math.round(value * 10) / 10}
						min={min}
						max={max}
						step={step}
						onChange={handleInputChange}
						onBlur={handleInputBlur}
						className="w-16 h-7 text-xs font-mono text-right px-2"
					/>
					{unit && (
						<span className="text-xs text-muted-foreground w-4">{unit}</span>
					)}
				</div>
			</div>
			<Slider
				value={[value]}
				min={min}
				max={max}
				step={step}
				onValueChange={([newValue]) => onChange(newValue)}
				onValueCommit={() => onBlur?.()}
				className="w-full"
			/>
		</div>
	);
}

export interface CheckboxProps {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
	const id = `checkbox-${label.replace(/\s/g, "-")}`;

	return (
		<div className="flex items-center gap-2.5">
			<ShadcnCheckbox
				id={id}
				checked={checked}
				onCheckedChange={(checkedState) => onChange(checkedState === true)}
			/>
			<Label htmlFor={id} className="text-sm cursor-pointer">
				{label}
			</Label>
		</div>
	);
}
