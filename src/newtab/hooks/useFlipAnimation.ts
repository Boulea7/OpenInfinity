import { useLayoutEffect, useRef } from 'react';

/**
 * A simpler, lightweight hook to animate children reordering using the FLIP technique.
 * It tracks the positions of children by their ID (via data-flip-id attribute)
 * and animates them when they move.
 */
export function useFlipAnimation<T extends HTMLElement>(deps: any[]) {
    const containerRef = useRef<T>(null);
    const positions = useRef<Map<string, DOMRect>>(new Map());

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 1. First (Capture positions before change - handled by the Cleanup/Previous effect cycle)
        // Actually in React strict mode / frequent updates, it's easier to capture "Snapshot" 
        // immediately before the browser paints the new state, but React's useLayoutEffect 
        // runs AFTER the DOM update but BEFORE paint.

        // So we need to have captured the "Before" positions previously.
        // The trick is: We capture "After" positions at the end of this effect, 
        // which become the "Before" positions for the NEXT render.

        const newPositions = new Map<string, DOMRect>();
        const children = Array.from(container.children) as HTMLElement[];

        // Calculate new positions
        children.forEach((child) => {
            const id = child.getAttribute('data-flip-id');
            if (id) {
                newPositions.set(id, child.getBoundingClientRect());
            }
        });

        // 2. Play Animation (Invert & Play)
        children.forEach((child) => {
            const id = child.getAttribute('data-flip-id');
            if (!id) return;

            const oldRect = positions.current.get(id);
            const newRect = newPositions.get(id);

            if (oldRect && newRect) {
                const dX = oldRect.left - newRect.left;
                const dY = oldRect.top - newRect.top;

                if (dX !== 0 || dY !== 0) {
                    // Invert
                    child.style.transform = `translate(${dX}px, ${dY}px)`;
                    child.style.transition = 'none';

                    // Play
                    requestAnimationFrame(() => {
                        child.style.transform = '';
                        child.style.transition = 'transform 300ms cubic-bezier(0.2, 0, 0.2, 1)';
                    });
                }
            }
        });

        // Save current positions for next time
        positions.current = newPositions;
    }, deps);

    return containerRef;
}
