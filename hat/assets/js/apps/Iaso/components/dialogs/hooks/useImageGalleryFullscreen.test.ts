import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    MAX_ZOOM,
    MIN_ZOOM,
    useImageGalleryFullscreen,
} from './useImageGalleryFullscreen';

const DEFAULT_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

const mockRequestFullscreen = vi.fn().mockResolvedValue(undefined);
const mockExitFullscreen = vi.fn().mockResolvedValue(undefined);

const setFullscreenElement = (element: Element | null) => {
    Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: element,
    });
};

const renderFullscreenHook = () => {
    const closeLightbox = vi.fn();
    const hook = renderHook(() =>
        useImageGalleryFullscreen({ closeLightbox }),
    );
    return { ...hook, closeLightbox };
};

const attachOverlay = (
    result: { current: ReturnType<typeof useImageGalleryFullscreen> },
): HTMLDivElement => {
    const overlay = document.createElement('div');
    overlay.requestFullscreen = mockRequestFullscreen;
    result.current.overlayRef.current = overlay;
    return overlay;
};

const attachViewport = (
    result: { current: ReturnType<typeof useImageGalleryFullscreen> },
): HTMLDivElement => {
    const viewport = document.createElement('div');
    result.current.viewportRef.current = viewport;
    return viewport;
};

const enterFullscreen = (
    result: { current: ReturnType<typeof useImageGalleryFullscreen> },
): { overlay: HTMLDivElement; viewport: HTMLDivElement } => {
    const viewport = attachViewport(result);
    const overlay = attachOverlay(result);
    act(() => {
        result.current.toggleFullScreen();
    });
    return { overlay, viewport };
};

const dispatchTouch = (
    target: HTMLElement,
    type: string,
    points: Array<{ x: number; y: number }>,
): Event => {
    const touches = points.map((point, identifier) => ({
        identifier,
        clientX: point.x,
        clientY: point.y,
        target,
    }));
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, {
        touches: { value: touches },
        changedTouches: { value: touches },
    });
    target.dispatchEvent(event);
    return event;
};

const mouseDown = (
    result: { current: ReturnType<typeof useImageGalleryFullscreen> },
    clientX: number,
    clientY: number,
) => {
    const event = {
        preventDefault: vi.fn(),
        clientX,
        clientY,
    };
    act(() => {
        result.current.handleMouseDown(
            event as unknown as Parameters<
                typeof result.current.handleMouseDown
            >[0],
        );
    });
    return event;
};

describe('useImageGalleryFullscreen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setFullscreenElement(null);
        document.exitFullscreen = mockExitFullscreen;
    });

    afterEach(() => {
        setFullscreenElement(null);
    });

    it('starts outside fullscreen at min zoom', () => {
        const { result } = renderFullscreenHook();

        expect(result.current.isFullScreen).toBe(false);
        expect(result.current.zoom).toBe(MIN_ZOOM);
        expect(result.current.offset).toEqual({ x: 0, y: 0 });
        expect(result.current.isDragging).toBe(false);
    });

    it('enters fullscreen and requests native fullscreen on the overlay', () => {
        const { result } = renderFullscreenHook();
        attachOverlay(result);

        act(() => {
            result.current.toggleFullScreen();
        });

        expect(result.current.isFullScreen).toBe(true);
        expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
    });

    it('exits fullscreen and calls native exit when the document is fullscreen', () => {
        const { result } = renderFullscreenHook();
        const overlay = attachOverlay(result);

        act(() => {
            result.current.toggleFullScreen();
        });
        setFullscreenElement(overlay);
        act(() => {
            result.current.toggleFullScreen();
        });

        expect(result.current.isFullScreen).toBe(false);
        expect(mockExitFullscreen).toHaveBeenCalledTimes(1);
    });

    it('closes the gallery, leaves fullscreen and resets zoom', () => {
        const { result, closeLightbox } = renderFullscreenHook();
        attachOverlay(result);

        act(() => {
            result.current.toggleFullScreen();
        });
        act(() => {
            result.current.zoomIn();
        });
        act(() => {
            result.current.closeGallery();
        });

        expect(result.current.isFullScreen).toBe(false);
        expect(result.current.zoom).toBe(MIN_ZOOM);
        expect(closeLightbox).toHaveBeenCalledTimes(1);
    });

    it('closes the lightbox on Escape when not in fullscreen', () => {
        const { closeLightbox } = renderFullscreenHook();

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });

        expect(closeLightbox).toHaveBeenCalledTimes(1);
    });

    it('leaves CSS fullscreen on Escape without closing the lightbox', () => {
        const { result, closeLightbox } = renderFullscreenHook();
        attachOverlay(result);

        act(() => {
            result.current.toggleFullScreen();
        });
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });

        expect(result.current.isFullScreen).toBe(false);
        expect(closeLightbox).not.toHaveBeenCalled();
    });

    it('lets the browser handle Escape while native fullscreen is active', () => {
        const { result, closeLightbox } = renderFullscreenHook();
        const overlay = attachOverlay(result);

        act(() => {
            result.current.toggleFullScreen();
        });
        setFullscreenElement(overlay);
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });

        expect(result.current.isFullScreen).toBe(true);
        expect(closeLightbox).not.toHaveBeenCalled();
    });

    it('leaves fullscreen when the browser fires fullscreenchange', () => {
        const { result } = renderFullscreenHook();
        attachOverlay(result);

        act(() => {
            result.current.toggleFullScreen();
        });
        setFullscreenElement(null);
        act(() => {
            document.dispatchEvent(new Event('fullscreenchange'));
        });

        expect(result.current.isFullScreen).toBe(false);
        expect(result.current.zoom).toBe(MIN_ZOOM);
    });

    it('zooms in and out in steps and clamps at min/max', () => {
        const { result } = renderFullscreenHook();
        attachOverlay(result);

        act(() => {
            result.current.toggleFullScreen();
        });
        act(() => {
            result.current.zoomIn();
        });
        expect(result.current.zoom).toBe(MIN_ZOOM + ZOOM_STEP);

        act(() => {
            result.current.zoomOut();
        });
        expect(result.current.zoom).toBe(MIN_ZOOM);

        act(() => {
            result.current.zoomOut();
        });
        expect(result.current.zoom).toBe(MIN_ZOOM);

        for (let i = 0; i < 16; i += 1) {
            act(() => {
                result.current.zoomIn();
            });
        }
        expect(result.current.zoom).toBe(MAX_ZOOM);
    });

    it('resets zoom when leaving fullscreen', () => {
        const { result } = renderFullscreenHook();
        attachOverlay(result);

        act(() => {
            result.current.toggleFullScreen();
        });
        act(() => {
            result.current.zoomIn();
        });
        act(() => {
            result.current.toggleFullScreen();
        });

        expect(result.current.isFullScreen).toBe(false);
        expect(result.current.zoom).toBe(MIN_ZOOM);
        expect(result.current.offset).toEqual({ x: 0, y: 0 });
    });

    it('double-clicks to default zoom and back to min while fullscreen', () => {
        const { result } = renderFullscreenHook();
        attachOverlay(result);

        act(() => {
            result.current.toggleFullScreen();
        });
        act(() => {
            result.current.handleDoubleClick();
        });
        expect(result.current.zoom).toBe(DEFAULT_ZOOM);

        act(() => {
            result.current.handleDoubleClick();
        });
        expect(result.current.zoom).toBe(MIN_ZOOM);
    });

    it('ignores double-click zoom when not in fullscreen', () => {
        const { result } = renderFullscreenHook();

        act(() => {
            result.current.handleDoubleClick();
        });

        expect(result.current.zoom).toBe(MIN_ZOOM);
    });

    it('zooms with the wheel once the viewport is attached', () => {
        const { result } = renderFullscreenHook();
        const viewport = document.createElement('div');
        result.current.viewportRef.current = viewport;
        attachOverlay(result);

        act(() => {
            result.current.toggleFullScreen();
        });
        act(() => {
            viewport.dispatchEvent(
                new WheelEvent('wheel', { deltaY: -100, cancelable: true }),
            );
        });

        expect(result.current.zoom).toBe(MIN_ZOOM + ZOOM_STEP);
    });

    describe('pinch', () => {
        it('zooms out when fingers move apart', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 200, y: 0 },
                ]);
            });

            expect(result.current.zoom).toBe(2);
        });

        it('keeps the pinch origin zoom as the baseline while moving', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 200, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 150, y: 0 },
                ]);
            });

            expect(result.current.zoom).toBe(1.5);
        });

        it('pinches on a diagonal and scales by hypot distance', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 30, y: 40 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 60, y: 80 },
                ]);
            });

            expect(result.current.zoom).toBe(2);
        });

        it('clamps a huge pinch-out to max zoom', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 10, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 1000, y: 0 },
                ]);
            });

            expect(result.current.zoom).toBe(MAX_ZOOM);
        });

        it('clamps a pinch-in to min zoom', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                result.current.zoomIn();
            });
            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 1, y: 0 },
                ]);
            });

            expect(result.current.zoom).toBe(MIN_ZOOM);
            expect(result.current.offset).toEqual({ x: 0, y: 0 });
        });

        it('multiplies the zoom that was current at pinch start', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                result.current.zoomIn();
            });
            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 200, y: 0 },
                ]);
            });

            expect(result.current.zoom).toBe((MIN_ZOOM + ZOOM_STEP) * 2);
        });

        it('ignores a single finger', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                dispatchTouch(viewport, 'touchstart', [{ x: 0, y: 0 }]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [{ x: 400, y: 400 }]);
            });

            expect(result.current.zoom).toBe(MIN_ZOOM);
        });

        it('ignores three fingers', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                    { x: 50, y: 80 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 400, y: 0 },
                    { x: 50, y: 80 },
                ]);
            });

            expect(result.current.zoom).toBe(MIN_ZOOM);
        });

        it('stops pinch tracking after touchend', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchend', []);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 400, y: 0 },
                ]);
            });

            expect(result.current.zoom).toBe(MIN_ZOOM);
        });

        it('stops pinch tracking after touchcancel', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchcancel', []);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 400, y: 0 },
                ]);
            });

            expect(result.current.zoom).toBe(MIN_ZOOM);
        });

        it('does not pinch when not in fullscreen', () => {
            const { result } = renderFullscreenHook();
            const viewport = attachViewport(result);

            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 400, y: 0 },
                ]);
            });

            expect(result.current.zoom).toBe(MIN_ZOOM);
        });
    });

    describe('drag', () => {
        it('does not start a drag at min zoom', () => {
            const { result } = renderFullscreenHook();
            enterFullscreen(result);

            const event = mouseDown(result, 100, 50);

            expect(result.current.isDragging).toBe(false);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('does not start a drag outside fullscreen even when zoomed', () => {
            const { result } = renderFullscreenHook();

            act(() => {
                result.current.zoomIn();
            });
            const event = mouseDown(result, 100, 50);

            expect(result.current.isDragging).toBe(false);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it('pans with the mouse once zoomed in', () => {
            const { result } = renderFullscreenHook();
            enterFullscreen(result);

            act(() => {
                result.current.zoomIn();
            });
            const event = mouseDown(result, 100, 50);
            expect(result.current.isDragging).toBe(true);
            expect(event.preventDefault).toHaveBeenCalledTimes(1);

            act(() => {
                window.dispatchEvent(
                    new MouseEvent('mousemove', { clientX: 140, clientY: 90 }),
                );
            });

            expect(result.current.offset).toEqual({ x: 40, y: 40 });
        });

        it('keeps panning relative to the original mousedown', () => {
            const { result } = renderFullscreenHook();
            enterFullscreen(result);

            act(() => {
                result.current.zoomIn();
            });
            mouseDown(result, 10, 10);
            act(() => {
                window.dispatchEvent(
                    new MouseEvent('mousemove', { clientX: 20, clientY: 30 }),
                );
            });
            act(() => {
                window.dispatchEvent(
                    new MouseEvent('mousemove', { clientX: 0, clientY: 0 }),
                );
            });

            expect(result.current.offset).toEqual({ x: -10, y: -10 });
        });

        it('stops panning after mouseup', () => {
            const { result } = renderFullscreenHook();
            enterFullscreen(result);

            act(() => {
                result.current.zoomIn();
            });
            mouseDown(result, 100, 100);
            act(() => {
                window.dispatchEvent(
                    new MouseEvent('mousemove', { clientX: 130, clientY: 100 }),
                );
            });
            act(() => {
                window.dispatchEvent(new MouseEvent('mouseup'));
            });

            expect(result.current.isDragging).toBe(false);
            expect(result.current.offset).toEqual({ x: 30, y: 0 });

            act(() => {
                window.dispatchEvent(
                    new MouseEvent('mousemove', { clientX: 400, clientY: 400 }),
                );
            });

            expect(result.current.offset).toEqual({ x: 30, y: 0 });
        });

        it('stacks a second drag on the previous offset', () => {
            const { result } = renderFullscreenHook();
            enterFullscreen(result);

            act(() => {
                result.current.zoomIn();
            });
            mouseDown(result, 0, 0);
            act(() => {
                window.dispatchEvent(
                    new MouseEvent('mousemove', { clientX: 20, clientY: 10 }),
                );
            });
            act(() => {
                window.dispatchEvent(new MouseEvent('mouseup'));
            });
            mouseDown(result, 50, 50);
            act(() => {
                window.dispatchEvent(
                    new MouseEvent('mousemove', { clientX: 55, clientY: 60 }),
                );
            });

            expect(result.current.offset).toEqual({ x: 25, y: 20 });
        });

        it('clears the pan when zoom returns to min', () => {
            const { result } = renderFullscreenHook();
            enterFullscreen(result);

            act(() => {
                result.current.zoomIn();
            });
            mouseDown(result, 0, 0);
            act(() => {
                window.dispatchEvent(
                    new MouseEvent('mousemove', { clientX: 80, clientY: 80 }),
                );
            });
            act(() => {
                result.current.zoomOut();
            });

            expect(result.current.zoom).toBe(MIN_ZOOM);
            expect(result.current.offset).toEqual({ x: 0, y: 0 });
        });

        it('lets a pinch-zoom then a drag work together', () => {
            const { result } = renderFullscreenHook();
            const { viewport } = enterFullscreen(result);

            act(() => {
                dispatchTouch(viewport, 'touchstart', [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchmove', [
                    { x: 0, y: 0 },
                    { x: 200, y: 0 },
                ]);
            });
            act(() => {
                dispatchTouch(viewport, 'touchend', []);
            });

            expect(result.current.zoom).toBe(2);

            mouseDown(result, 40, 40);
            act(() => {
                window.dispatchEvent(
                    new MouseEvent('mousemove', { clientX: 10, clientY: 70 }),
                );
            });

            expect(result.current.isDragging).toBe(true);
            expect(result.current.offset).toEqual({ x: -30, y: 30 });
        });

        it('resets pan when leaving fullscreen mid-drag', () => {
            const { result } = renderFullscreenHook();
            enterFullscreen(result);

            act(() => {
                result.current.zoomIn();
            });
            mouseDown(result, 0, 0);
            act(() => {
                window.dispatchEvent(
                    new MouseEvent('mousemove', { clientX: 25, clientY: 40 }),
                );
            });
            act(() => {
                result.current.toggleFullScreen();
            });

            expect(result.current.isFullScreen).toBe(false);
            expect(result.current.isDragging).toBe(false);
            expect(result.current.offset).toEqual({ x: 0, y: 0 });
            expect(result.current.zoom).toBe(MIN_ZOOM);
        });
    });
});
