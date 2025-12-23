/**
 * 著作権表示フッター
 */

export function Footer({ className = "" }: { className?: string }) {
	return (
		<footer
			className={`text-center text-xs text-muted-foreground py-4 px-4 space-y-1 ${className}`}
		>
			<p>FINAL FANTASY XIV ©2010 - 2025 SQUARE ENIX CO., LTD.</p>
			<p>
				FINAL FANTASY is a registered trademark of Square Enix Holdings Co.,
				Ltd. All material used under license.
			</p>
			<p>STGY Tools is not affiliated with SQUARE ENIX CO., LTD.</p>
		</footer>
	);
}

/**
 * コンパクト版フッター（エディター用）
 */
export function CompactFooter({ className = "" }: { className?: string }) {
	return (
		<footer
			className={`text-center text-[10px] text-muted-foreground/70 py-1.5 px-2 ${className}`}
		>
			<p>
				FINAL FANTASY XIV ©2010 - 2025 SQUARE ENIX CO., LTD. | STGY Tools is not
				affiliated with SQUARE ENIX CO., LTD.
			</p>
		</footer>
	);
}
