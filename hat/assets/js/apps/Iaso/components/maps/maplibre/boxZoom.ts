import type { Map as MapLibreMap$ } from 'maplibre-gl';

/** smaller than this, in pixels, a box is a click: the box zoom stays on */
const MIN_BOX_SIZE = 5;

type Point = [number, number];

/**
 * Lets the next plain drag on `map` draw a box and zoom to it - MapLibre's own box zoom, without holding shift.
 * Panning is off meanwhile. `onEnd` is called once the box is zoomed to, or on Escape; the returned function
 * stops it all and restores the map, whichever ended it.
 */
export const startBoxZoom = (
    map: MapLibreMap$,
    onEnd: () => void,
): (() => void) => {
    const container = map.getCanvasContainer();
    const canvas = map.getCanvas();
    const wasPanning = map.dragPan.isEnabled();
    const previousCursor = canvas.style.cursor;
    map.dragPan.disable();
    canvas.style.cursor = 'crosshair';

    let start: Point | undefined;
    let box: HTMLDivElement | undefined;

    const position = (event: MouseEvent): Point => {
        const rect = container.getBoundingClientRect();
        return [
            event.clientX - rect.left - container.clientLeft,
            event.clientY - rect.top - container.clientTop,
        ];
    };
    const clearBox = () => {
        box?.remove();
        box = undefined;
        start = undefined;
    };

    const onPointerDown = (event: PointerEvent) => {
        // shift: MapLibre's own box zoom, ctrl: rotating
        if (event.button !== 0 || event.shiftKey || event.ctrlKey) {
            return;
        }
        event.preventDefault();
        start = position(event);
        box = document.createElement('div');
        // styled by maplibre-gl.css, as its own box zoom
        box.className = 'maplibregl-boxzoom';
        container.appendChild(box);
    };
    const onPointerMove = (event: PointerEvent) => {
        if (!start || !box) {
            return;
        }
        const [x, y] = position(event);
        box.style.transform = `translate(${Math.min(start[0], x)}px, ${Math.min(start[1], y)}px)`;
        box.style.width = `${Math.abs(x - start[0])}px`;
        box.style.height = `${Math.abs(y - start[1])}px`;
    };
    const onPointerUp = (event: PointerEvent) => {
        if (!start) {
            return;
        }
        const from = start;
        const to = position(event);
        clearBox();
        if (
            Math.abs(to[0] - from[0]) < MIN_BOX_SIZE ||
            Math.abs(to[1] - from[1]) < MIN_BOX_SIZE
        ) {
            return;
        }
        map.fitScreenCoordinates(from, to, map.getBearing(), { linear: true });
        onEnd();
    };
    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onEnd();
        }
    };

    container.addEventListener('pointerdown', onPointerDown);
    // on the window: the box can be released outside the map
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
        container.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('keydown', onKeyDown);
        clearBox();
        canvas.style.cursor = previousCursor;
        if (wasPanning) {
            map.dragPan.enable();
        }
    };
};
