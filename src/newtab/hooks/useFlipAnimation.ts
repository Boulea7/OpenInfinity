import { useLayoutEffect, useRef } from 'react';

/**
 * A simpler, lightweight hook to animate children reordering using the FLIP technique.
 * It tracks the positions of children by their ID (via data-flip-id attribute)
 * and animates them when they move.
 *
 * Optimized to only trigger animations when the actual order of elements changes,
 * not when other properties update.
 */
export function useFlipAnimation<T extends HTMLElement>(deps: any[]) {
    const containerRef = useRef<T>(null);
    const positions = useRef<Map<string, DOMRect>>(new Map());
    const prevOrderKey = useRef<string>('');  // Cache previous order to detect changes

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 1. Extract current order from DOM
        const children = Array.from(container.children) as HTMLElement[];
        const currentOrderKey = children
            .map(child => child.getAttribute('data-flip-id'))
            .filter(Boolean)
            .join('|');

        // 2. Early return if order hasn't changed
        // This prevents unnecessary animations when only data updates (not reordering)
        if (currentOrderKey === prevOrderKey.current) {
            return;
        }
        prevOrderKey.current = currentOrderKey;

        // 3. Calculate new positions
        const newPositions = new Map<string, DOMRect>();
        children.forEach((child) => {
            const id = child.getAttribute('data-flip-id');
            if (id) {
                newPositions.set(id, child.getBoundingClientRect());
            }
        });

        // 4. Play Animation (Invert & Play)
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

        // 5. Save current positions for next time
        positions.current = newPositions;
    }, deps);

    return containerRef;
}
