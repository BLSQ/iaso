import L from 'leaflet';
import { describe, expect, it, vi } from 'vitest';
import location from '../../../images/location.svg';
import square from '../../../images/square.svg';

import './zoom-bar';

type Listener = {
    type: string;
    fn: (event?: unknown) => void;
    context?: unknown;
};

type FakeMap = {
    _container: HTMLElement;
    _zoom: number;
    options: { zoomDelta: number };
    dragging: {
        disable: ReturnType<typeof vi.fn>;
        enable: ReturnType<typeof vi.fn>;
    };
    boxZoom: {
        addHooks: ReturnType<typeof vi.fn>;
        removeHooks: ReturnType<typeof vi.fn>;
        _onMouseDown: ReturnType<typeof vi.fn>;
    };
    listeners: Listener[];
    getZoom: () => number;
    getMinZoom: () => number;
    getMaxZoom: () => number;
    getContainer: () => HTMLElement;
    zoomIn: ReturnType<typeof vi.fn>;
    zoomOut: ReturnType<typeof vi.fn>;
    on: (types: string, fn: Listener['fn'], context?: unknown) => FakeMap;
    off: (types: string, fn: Listener['fn'], context?: unknown) => FakeMap;
};

const createMap = (zoom = 5): FakeMap => {
    const container = document.createElement('div');
    const listeners: Listener[] = [];
    const map: FakeMap = {
        _container: container,
        _zoom: zoom,
        options: { zoomDelta: 1 },
        dragging: { disable: vi.fn(), enable: vi.fn() },
        boxZoom: {
            addHooks: vi.fn(),
            removeHooks: vi.fn(),
            _onMouseDown: vi.fn(),
        },
        listeners,
        getZoom: () => map._zoom,
        getMinZoom: () => 0,
        getMaxZoom: () => 18,
        getContainer: () => container,
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        on(types, fn, context) {
            types.split(' ').forEach(type => {
                listeners.push({ type, fn, context });
            });
            return map;
        },
        off(types, fn, context) {
            types.split(' ').forEach(type => {
                const index = listeners.findIndex(
                    listener =>
                        listener.type === type &&
                        listener.fn === fn &&
                        listener.context === context,
                );
                if (index >= 0) {
                    listeners.splice(index, 1);
                }
            });
            return map;
        },
    };
    return map;
};

const addControl = (
    map: FakeMap,
    options: L.Control.ZoomOptions = {},
): { control: L.Control.Zoom; element: HTMLElement } => {
    const control = new L.Control.Zoom(options);
    const element = control.onAdd!(map as unknown as L.Map);
    return { control, element };
};

const button = (element: HTMLElement, className: string): HTMLAnchorElement => {
    const link = element.querySelector<HTMLAnchorElement>(`.${className}`);
    if (!link) {
        throw new Error(`Missing .${className}`);
    }
    return link;
};

describe('zoom bar', () => {
    it('renders zoom in, zoom out and box zoom, and skips fit without a callback', () => {
        const { element } = addControl(createMap());

        expect(element.className).toContain('leaflet-control-zoom');
        expect(element.className).toContain('hide-on-print');
        expect(button(element, 'leaflet-control-zoom-in').title).toBe(
            'Zoom in',
        );
        expect(button(element, 'leaflet-control-zoom-out').title).toBe(
            'Zoom out',
        );
        expect(
            button(element, 'leaflet-control-zoom-box')
                .querySelector('img')
                ?.getAttribute('src'),
        ).toBe(square);
        expect(
            element.querySelector('.leaflet-control-zoom-fit'),
        ).not.toBeInTheDocument();
    });

    it('adds a fit button that calls fitToBounds', () => {
        const fitToBounds = vi.fn();
        const { element } = addControl(createMap(), {
            fitToBounds,
            fitToBoundsTitle: 'Fit to bounds',
        });
        const fit = button(element, 'leaflet-control-zoom-fit');

        expect(fit.title).toBe('Fit to bounds');
        expect(fit.querySelector('img')?.getAttribute('src')).toBe(location);

        fit.click();

        expect(fitToBounds).toHaveBeenCalledTimes(1);
    });

    it('zooms the map from the in and out buttons', () => {
        const map = createMap();
        const { element } = addControl(map);

        button(element, 'leaflet-control-zoom-in').click();
        button(element, 'leaflet-control-zoom-out').click();

        expect(map.zoomIn).toHaveBeenCalledTimes(1);
        expect(map.zoomOut).toHaveBeenCalledTimes(1);
    });

    it('disables zoom in when the map is already at max zoom', () => {
        const { element } = addControl(createMap(18));
        const zoomIn = button(element, 'leaflet-control-zoom-in');

        expect(zoomIn).toHaveClass('leaflet-disabled');
        expect(zoomIn).toHaveAttribute('aria-disabled', 'true');
    });

    it('toggles box zoom and forwards the drag as a shift-click', () => {
        const map = createMap();
        const { element } = addControl(map, { zoomBoxTitle: 'Draw a square' });
        const box = button(element, 'leaflet-control-zoom-box');

        box.click();

        expect(box).toHaveClass('active');
        expect(map._container).toHaveClass('leaflet-control-boxzoom-active');
        expect(map.dragging.disable).toHaveBeenCalledTimes(1);
        expect(map.boxZoom.addHooks).toHaveBeenCalledTimes(1);

        const mouseDown = map.listeners.find(
            listener => listener.type === 'mousedown',
        );
        mouseDown?.fn.call(mouseDown.context, {
            originalEvent: { clientX: 12, clientY: 34 },
        });

        expect(map.boxZoom._onMouseDown).toHaveBeenCalledWith({
            clientX: 12,
            clientY: 34,
            which: 1,
            shiftKey: true,
        });

        box.click();

        expect(box).not.toHaveClass('active');
        expect(map._container).not.toHaveClass(
            'leaflet-control-boxzoom-active',
        );
        expect(map.dragging.enable).toHaveBeenCalledTimes(1);
        expect(map.boxZoom.removeHooks).toHaveBeenCalledTimes(1);
        expect(
            map.listeners.some(listener => listener.type === 'mousedown'),
        ).toBe(false);
    });

    it('leaves box zoom when the map fires boxzoomend', () => {
        const map = createMap();
        const { element } = addControl(map);
        button(element, 'leaflet-control-zoom-box').click();

        const boxZoomEnd = map.listeners.find(
            listener => listener.type === 'boxzoomend',
        );
        boxZoomEnd?.fn.call(boxZoomEnd.context);

        expect(map.dragging.enable).toHaveBeenCalledTimes(1);
        expect(map._container).not.toHaveClass(
            'leaflet-control-boxzoom-active',
        );
    });

    it('drops zoom listeners when the control is removed', () => {
        const map = createMap();
        const { control } = addControl(map);

        expect(map.listeners.map(listener => listener.type)).toEqual([
            'zoomend',
            'zoomlevelschange',
        ]);

        control.onRemove!(map as unknown as L.Map);

        expect(map.listeners).toEqual([]);
    });

    it('writes the current zoom level into the info button', () => {
        const map = createMap(7);
        const { control } = addControl(map);
        const bar = control as L.Control.Zoom & {
            _zoomInfoButton: { innerHTML: string | number };
            _updateInfoValue: () => void;
        };
        bar._zoomInfoButton = { innerHTML: '' };

        bar._updateInfoValue();

        expect(bar._zoomInfoButton.innerHTML).toBe(7);
    });
});
