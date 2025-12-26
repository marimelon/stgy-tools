import { Link, useLocation } from "@tanstack/react-router";

interface DebugHeaderProps {
	title: string;
	description: string;
}

const debugPages = [
	{ path: "/debug", label: "Objects" },
	{ path: "/debug-render", label: "Render" },
	{ path: "/debug-stgy", label: "stgy" },
] as const;

export function DebugHeader({ title, description }: DebugHeaderProps) {
	const location = useLocation();

	return (
		<header className="app-header p-4 border-b border-border">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="app-logo text-2xl">{title}</h1>
					<p className="text-muted-foreground text-sm mt-1">{description}</p>
				</div>
				<nav className="flex items-center gap-1">
					{debugPages.map((page) => {
						const isActive = location.pathname === page.path;
						return (
							<Link
								key={page.path}
								to={page.path}
								className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
									isActive
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:text-foreground hover:bg-muted"
								}`}
							>
								{page.label}
							</Link>
						);
					})}
				</nav>
			</div>
		</header>
	);
}

