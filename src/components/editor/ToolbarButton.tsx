/**
 * Toolbar button component based on shadcn/ui Button
 */

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ToolbarButtonProps {
	children: ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	title?: string;
	className?: string;
	active?: boolean;
}

export function ToolbarButton({
	children,
	onClick,
	disabled,
	title,
	className,
	active = false,
}: ToolbarButtonProps) {
	const button = (
		<Button
			variant={active ? "default" : "outline"}
			size="icon-sm"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				active &&
					"bg-accent text-accent-foreground shadow-[0_0_8px_var(--color-accent-secondary-muted)]",
				className,
			)}
		>
			{children}
		</Button>
	);

	if (title) {
		return (
			<TooltipProvider delayDuration={300}>
				<Tooltip>
					<TooltipTrigger asChild>{button}</TooltipTrigger>
					<TooltipContent side="bottom" className="font-sans">
						{title}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return button;
}

export function Divider() {
	return <Separator orientation="vertical" className="h-6 mx-1" />;
}
