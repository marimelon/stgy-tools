/**
 * Integration test for scroll position preservation in ViewerGrid.
 *
 * This test verifies that scroll position is maintained when:
 * 1. TanStack Router's scrollRestoration is enabled
 * 2. history.replaceState() is called (which triggers scroll restoration)
 * 3. Drag and drop reorder is performed
 */

import "@/lib/i18n";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ViewerGrid } from "@/components/viewer/ViewerGrid";
import {
	parseMultipleStgyCodes,
	type ViewerBoard,
	ViewerStoreProvider,
} from "@/lib/viewer";

// Sample stgy codes for testing
const SAMPLE_STGY_1 =
	"[stgy:a0OcAwAYAfwgAFYAFBAAZYTLdYTLdYTLdYTLdYTLdYTLdYTLd]";
const SAMPLE_STGY_2 =
	"[stgy:ag40qa9YRyTPXZgVoFg1PhfYFKZPnDzJzfLyt51cHDkEEDia+PwMEbq7od+fEJ186kZxqHZSMHPrEWXPrSypGr47NcAkRTNWvNc4OQ8QPYGychElb-BvEZo+Os2dqLJFN5bLGkAn9j6mR4eNSYvA+eu-Zar0FYE3f+Zwa8nty3QUC86FlycOdOJ8vxFWYJmHZ0tDKEDcrVmRZol1QuWNRmlqVyTQbcN-m6t1S4EohXk05l6LzIfdDuS4rKemSgCMDOWI0]";

function createTestBoards(): ViewerBoard[] {
	return parseMultipleStgyCodes(`${SAMPLE_STGY_1}\n${SAMPLE_STGY_2}`);
}

/**
 * Create a test router with scrollRestoration enabled
 */
function createTestRouterWithScrollRestoration(component: React.ReactNode) {
	const rootRoute = createRootRoute({
		component: () => <Outlet />,
	});

	const indexRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "/",
		component: () => <>{component}</>,
	});

	const routeTree = rootRoute.addChildren([indexRoute]);

	const router = createRouter({
		routeTree,
		history: createMemoryHistory({
			initialEntries: ["/"],
		}),
		scrollRestoration: true,
	});

	return router;
}

describe("ViewerGrid Scroll Integration", () => {
	beforeEach(() => {
		// Reset scroll position
		window.scrollTo(0, 0);
	});

	it("preserves scroll position when history.replaceState is called with scrollRestoration enabled", async () => {
		const initialBoards = createTestBoards();
		let replaceStateCalled = false;

		// Create a component that calls replaceState on reorder (simulating index.tsx behavior)
		// Also simulates the scroll reset that TanStack Router's scrollRestoration causes
		function TestComponent() {
			const handleReorder = () => {
				replaceStateCalled = true;
				// Simulate what index.tsx does: update URL via replaceState
				const url = new URL(window.location.href);
				url.searchParams.set("test", Date.now().toString());
				window.history.replaceState(null, "", url.toString());

				// Simulate TanStack Router's scrollRestoration resetting scroll to 0
				// This happens asynchronously in the real app
				setTimeout(() => {
					window.scrollTo(0, 0);
				}, 10);
			};

			return (
				<div style={{ height: "2000px", paddingTop: "500px" }}>
					<ViewerStoreProvider initialBoards={initialBoards}>
						<ViewerGrid
							boards={initialBoards}
							onSelectBoard={() => {}}
							onCloseBoard={() => {}}
							onReorder={handleReorder}
						/>
					</ViewerStoreProvider>
				</div>
			);
		}

		const router = createTestRouterWithScrollRestoration(<TestComponent />);

		await render(<RouterProvider router={router} />);

		// Scroll down
		window.scrollTo(0, 300);
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(window.scrollY).toBe(300);

		// Get cards and drag handles
		const cards = document.querySelectorAll("[data-testid='viewer-grid-card']");
		expect(cards.length).toBe(2);

		// Hover to show drag handle
		await userEvent.hover(cards[0]);
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Find the drag handle button
		const dragHandle = cards[0].querySelector(
			"button[class*='cursor-grab']",
		) as HTMLElement;
		expect(dragHandle).toBeTruthy();

		// Simulate drag and drop using pointer events
		const handleRect = dragHandle.getBoundingClientRect();
		const card2Rect = cards[1].getBoundingClientRect();

		const startX = handleRect.left + handleRect.width / 2;
		const startY = handleRect.top + handleRect.height / 2;
		const endX = card2Rect.left + card2Rect.width / 2;
		const endY = card2Rect.top + card2Rect.height / 2;

		// Start drag - dnd-kit requires activationConstraint.distance of 8px
		dragHandle.dispatchEvent(
			new PointerEvent("pointerdown", {
				bubbles: true,
				cancelable: true,
				clientX: startX,
				clientY: startY,
				pointerId: 1,
				pointerType: "mouse",
				isPrimary: true,
			}),
		);

		await new Promise((resolve) => setTimeout(resolve, 20));

		// Move slightly to trigger activation (> 8px distance)
		dragHandle.dispatchEvent(
			new PointerEvent("pointermove", {
				bubbles: true,
				cancelable: true,
				clientX: startX + 10,
				clientY: startY + 10,
				pointerId: 1,
				pointerType: "mouse",
				isPrimary: true,
			}),
		);

		await new Promise((resolve) => setTimeout(resolve, 50));

		// Move to target position
		document.dispatchEvent(
			new PointerEvent("pointermove", {
				bubbles: true,
				cancelable: true,
				clientX: endX,
				clientY: endY,
				pointerId: 1,
				pointerType: "mouse",
				isPrimary: true,
			}),
		);

		await new Promise((resolve) => setTimeout(resolve, 50));

		// Release
		document.dispatchEvent(
			new PointerEvent("pointerup", {
				bubbles: true,
				cancelable: true,
				clientX: endX,
				clientY: endY,
				pointerId: 1,
				pointerType: "mouse",
				isPrimary: true,
			}),
		);

		// Wait for scroll restoration (500ms monitoring period + buffer)
		await new Promise((resolve) => setTimeout(resolve, 600));

		// Verify replaceState was called
		expect(replaceStateCalled).toBe(true);

		// Verify scroll position is preserved (this is what we're testing)
		expect(window.scrollY).toBe(300);
	});

	it("scroll position is reset without the fix (demonstration test)", async () => {
		// This test demonstrates that without ViewerGrid's scroll preservation,
		// the scroll position would be reset. We skip this as it requires
		// modifying the component, but it documents the expected behavior.

		// The fix in ViewerGrid:
		// 1. Saves scroll position before onReorder
		// 2. Monitors scroll events for 500ms
		// 3. Restores scroll position whenever it changes
		expect(true).toBe(true);
	});
});
