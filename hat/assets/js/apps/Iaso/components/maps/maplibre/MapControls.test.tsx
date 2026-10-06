import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import {
    BoxZoomButton,
    FitBoundsButton,
    FullscreenButton,
    MapControlGroup,
    ZoomButtons,
} from './MapControls';

const { map, mockStartBoxZoom, stopBoxZoom } = vi.hoisted(() => ({
    map: {
        zoom: 3,
        getZoom: vi.fn(),
        getMinZoom: () => 0,
        getMaxZoom: () => 22,
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        fitBounds: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        getMap: vi.fn(),
        // the fit menu opens in it
        container: document.body.appendChild(document.createElement('div')),
        getContainer: () => map.container,
    },
    mockStartBoxZoom: vi.fn(),
    stopBoxZoom: vi.fn(),
}));

// jsdom has no WebGL: a map that records what the controls ask of it
vi.mock('@vis.gl/react-maplibre', () => ({
    useMap: () => ({ current: map }),
    useControl: (onCreate: () => { onAdd: () => HTMLElement }) => {
        const control = onCreate();
        document.body.appendChild(control.onAdd());
        return control;
    },
}));
vi.mock('./boxZoom', () => ({ startBoxZoom: mockStartBoxZoom }));

const results = {
    key: 'results',
    label: 'Fit to the results',
    bounds: [
        [12, -13],
        [31, 5],
    ] as [[number, number], [number, number]],
};
const all = {
    key: 'all',
    label: 'Show all',
    bounds: [
        [-6, -13],
        [31, 50],
    ] as [[number, number], [number, number]],
};

describe('MapControls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        map.getZoom.mockReturnValue(3);
        mockStartBoxZoom.mockReturnValue(stopBoxZoom);
    });

    it('renders its buttons in a MapLibre control group', () => {
        renderWithThemeAndIntlProvider(
            <MapControlGroup>
                <ZoomButtons />
            </MapControlGroup>,
        );
        const zoomIn = screen.getByRole('button', { name: 'Zoom in' });
        expect(
            zoomIn.closest('.maplibregl-ctrl.maplibregl-ctrl-group'),
        ).not.toBeNull();
        fireEvent.click(zoomIn);
        expect(map.zoomIn).toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
        expect(map.zoomOut).toHaveBeenCalled();
    });

    it('disables zooming out at the min zoom', () => {
        map.getZoom.mockReturnValue(0);
        renderWithThemeAndIntlProvider(<ZoomButtons />);
        expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Zoom in' }),
        ).not.toBeDisabled();
    });

    it('turns box zoom on and off, and shows it on', () => {
        renderWithThemeAndIntlProvider(<BoxZoomButton />);
        const button = screen.getByRole('button', {
            name: 'Draw a square on the map to zoom in to an area',
        });
        expect(button).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(mockStartBoxZoom).toHaveBeenCalledTimes(1);
        // a box drawn: it turns itself off
        const [, onEnd] = mockStartBoxZoom.mock.calls[0];
        act(() => onEnd());
        expect(button).toHaveAttribute('aria-pressed', 'false');
        expect(stopBoxZoom).toHaveBeenCalledTimes(1);
    });

    it('fits to its only target at once', () => {
        renderWithThemeAndIntlProvider(
            <FitBoundsButton targets={[results, { key: 'x', label: 'X' }]} />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Center the map' }));
        expect(map.fitBounds).toHaveBeenCalledWith(results.bounds, {
            padding: 40,
            maxZoom: 14,
        });
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('offers several targets in a menu', () => {
        renderWithThemeAndIntlProvider(
            <FitBoundsButton targets={[results, all]} />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Center the map' }));
        expect(map.fitBounds).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('menuitem', { name: 'Show all' }));
        expect(map.fitBounds).toHaveBeenCalledWith(
            all.bounds,
            expect.anything(),
        );
    });

    it('is disabled with nothing to fit to', () => {
        renderWithThemeAndIntlProvider(
            <FitBoundsButton targets={[{ key: 'x', label: 'X' }]} />,
        );
        expect(
            screen.getByRole('button', { name: 'Center the map' }),
        ).toBeDisabled();
    });

    describe('fullscreen', () => {
        beforeEach(() => {
            Object.defineProperty(document, 'fullscreenEnabled', {
                value: true,
                configurable: true,
            });
            document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
            map.container.requestFullscreen = vi
                .fn()
                .mockRejectedValue(new Error('refused'));
        });

        it('puts the map in fullscreen and back', () => {
            renderWithThemeAndIntlProvider(<FullscreenButton />);
            fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
            expect(map.container.requestFullscreen).toHaveBeenCalled();

            Object.defineProperty(document, 'fullscreenElement', {
                value: map.container,
                configurable: true,
            });
            act(() => {
                document.dispatchEvent(new Event('fullscreenchange'));
            });
            fireEvent.click(
                screen.getByRole('button', { name: 'Exit fullscreen' }),
            );
            expect(document.exitFullscreen).toHaveBeenCalled();
        });

        it('is not there when the browser cannot', () => {
            Object.defineProperty(document, 'fullscreenEnabled', {
                value: false,
                configurable: true,
            });
            renderWithThemeAndIntlProvider(<FullscreenButton />);
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });
    });
});
