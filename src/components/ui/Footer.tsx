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
						<p>© SQUARE ENIX</p>
						<p>STGY Tools is not affiliated with SQUARE ENIX CO., LTD.</p>
						<p className="mt-1.5 pt-1.5 border-t border-border/20">
							<a
								href="mailto:contact@stgy.m4e.dev"
								className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
							>
								Contact: contact@stgy.m4e.dev
							</a>
						</p>
						<button
							type="button"
							onClick={() => setExpanded(false)}
							className="text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-1"
						>
							−
						</button>
					</div>
				) : (
					<div className="flex items-center justify-center gap-2 flex-wrap">
						<button
							type="button"
							onClick={() => setExpanded(true)}
							className="hover:text-muted-foreground transition-colors"
						>
							© SQUARE ENIX · STGY Tools is unofficial
						</button>
						<span className="text-muted-foreground/30">|</span>
						<a
							href="mailto:contact@stgy.m4e.dev"
							className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
						>
							Contact
						</a>
					</div>
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
			<p>© SQUARE ENIX · STGY Tools is unofficial</p>
		</footer>
	);
}
