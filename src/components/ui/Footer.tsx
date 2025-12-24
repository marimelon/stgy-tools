/**
 * 著作権表示フッター
 * デフォルトでコンパクト表示、展開可能
 */

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Footer({ className = "" }: { className?: string }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<footer
			className={cn(
				"text-center text-[10px] text-muted-foreground/60 py-2 px-4 border-t border-border/30",
				className,
			)}
		>
			<div className="max-w-4xl mx-auto">
				{expanded ? (
					<div className="space-y-0.5 animate-in fade-in duration-200">
						<p>FINAL FANTASY XIV ©2010 - 2025 SQUARE ENIX CO., LTD.</p>
						<p>
							FINAL FANTASY is a registered trademark of Square Enix Holdings
							Co., Ltd. All material used under license.
						</p>
						<p>STGY Tools is not affiliated with SQUARE ENIX CO., LTD.</p>
						<button
							type="button"
							onClick={() => setExpanded(false)}
							className="text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-1"
						>
							−
						</button>
					</div>
				) : (
					<button
						type="button"
						onClick={() => setExpanded(true)}
						className="hover:text-muted-foreground transition-colors"
					>
						FFXIV ©SQUARE ENIX · STGY Tools is unofficial
					</button>
				)}
			</div>
		</footer>
	);
}

/**
 * コンパクト版フッター（エディター用）
 */
export function CompactFooter({ className = "" }: { className?: string }) {
	return (
		<footer
			className={cn(
				"text-center text-[10px] text-muted-foreground/50 py-1.5 px-2",
				className,
			)}
		>
			<p>FFXIV ©SQUARE ENIX · STGY Tools is unofficial</p>
		</footer>
	);
}
