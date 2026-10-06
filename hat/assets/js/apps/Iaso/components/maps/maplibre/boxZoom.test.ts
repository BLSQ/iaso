import type { Map as MapLibreMap$ } from 'maplibre-gl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startBoxZoom } from './boxZoom';

const pointer = (type: string, x: number, y: number, init = {}) =>
    new MouseEvent(type, {
        clientX: x,
        clientY: y,
        button: 0,
        bubbles: true,
        cancelable: true,
        ...init,
    });

describe('startBoxZoom', () => {
    let container: HTMLDivElement;
    let canvas: HTMLCanvasElement;
    let map: MapLibreMap$;
    let panning: boolean;

    beforeEach(() => {
        container = document.createElement('div');
        canvas = document.createElement('canvas');
        container.appendChild(canvas);
        document.body.appendChild(container);
        panning = true;
        map = {
            getCanvasContainer: () => container,
            getCanvas: () => canvas,
            getBearing: () => 0,
            fitScreenCoordinates: vi.fn(),
            dragPan: {
                isEnabled: () => panning,
                disable: () => {
                    panning = false;
                },
                enable: () => {
                    panning = true;
                },
            },
        } as unknown as MapLibreMap$;
    });

    it('zooms to the box drawn by a plain drag, then ends', () => {
        const onEnd = vi.fn();
        const stop = startBoxZoom(map, onEnd);
        expect(panning).toBe(false);
        expect(canvas.style.cursor).toBe('crosshair');

        container.dispatchEvent(pointer('pointerdown', 10, 20));
        window.dispatchEvent(pointer('pointermove', 50, 5));
        const box = container.querySelector(
            '.maplibregl-boxzoom',
        ) as HTMLElement;
        expect(box.style.transform).toBe('translate(10px, 5px)');
        expect(box.style.width).toBe('40px');
        expect(box.style.height).toBe('15px');

        window.dispatchEvent(pointer('pointerup', 60, 80));
        expect(map.fitScreenCoordinates).toHaveBeenCalledWith(
            [10, 20],
            [60, 80],
            0,
            { linear: true },
        );
        expect(onEnd).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.maplibregl-boxzoom')).toBeNull();

        stop();
        expect(panning).toBe(true);
        expect(canvas.style.cursor).toBe('');
    });

    it('stays on after a click, leaves shift-drags to MapLibre', () => {
        const onEnd = vi.fn();
        startBoxZoom(map, onEnd);
        container.dispatchEvent(pointer('pointerdown', 10, 10));
        window.dispatchEvent(pointer('pointerup', 12, 11));
        container.dispatchEvent(
            pointer('pointerdown', 10, 10, { shiftKey: true }),
        );
        window.dispatchEvent(pointer('pointerup', 100, 100));
        expect(map.fitScreenCoordinates).not.toHaveBeenCalled();
        expect(onEnd).not.toHaveBeenCalled();
    });

    it('ends on Escape, and stopping removes the box being drawn', () => {
        const onEnd = vi.fn();
        const stop = startBoxZoom(map, onEnd);
        container.dispatchEvent(pointer('pointerdown', 10, 10));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(onEnd).toHaveBeenCalledTimes(1);
        stop();
        expect(container.querySelector('.maplibregl-boxzoom')).toBeNull();
        // nothing listens anymore
        container.dispatchEvent(pointer('pointerdown', 10, 10));
        window.dispatchEvent(pointer('pointerup', 100, 100));
        expect(map.fitScreenCoordinates).not.toHaveBeenCalled();
    });

    it('leaves panning off when it was off', () => {
        panning = false;
        startBoxZoom(map, vi.fn())();
        expect(panning).toBe(false);
    });
});
