import React, { useCallback, useEffect, useRef, useState } from 'react';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;
const DEFAULT_ZOOM = 2.5;

const clampZoom = (value: number): number =>
    Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const getTouchDistance = (touches: TouchList): number => {
    const first = touches[0];
    const second = touches[1];
    return Math.hypot(
        first.clientX - second.clientX,
        first.clientY - second.clientY,
    );
};

type ImageZoomPan = {
    zoom: number;
    offset: { x: number; y: number };
    isDragging: boolean;
    viewportRef: React.RefObject<HTMLDivElement>;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    handleMouseDown: (event: React.MouseEvent) => void;
    handleDoubleClick: () => void;
};

const useImageZoomPan = (isEnabled: boolean): ImageZoomPan => {
    const [zoom, setZoom] = useState<number>(MIN_ZOOM);
    const [offset, setOffset] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0,
    });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
    const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
    const zoomRef = useRef(zoom);
    zoomRef.current = zoom;

    const resetZoom = useCallback(() => {
        setZoom(MIN_ZOOM);
        setOffset({ x: 0, y: 0 });
        setIsDragging(false);
    }, []);

    const applyZoom = useCallback((nextZoom: number) => {
        const clamped = clampZoom(nextZoom);
        setZoom(clamped);
        if (clamped <= MIN_ZOOM) {
            setOffset({ x: 0, y: 0 });
        }
    }, []);

    const zoomIn = useCallback(() => {
        applyZoom(zoomRef.current + ZOOM_STEP);
    }, [applyZoom]);

    const zoomOut = useCallback(() => {
        applyZoom(zoomRef.current - ZOOM_STEP);
    }, [applyZoom]);

    useEffect(() => {
        if (!isEnabled) {
            resetZoom();
        }
    }, [isEnabled, resetZoom]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport || !isEnabled) return undefined;

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            applyZoom(zoomRef.current + delta);
        };

        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length === 2) {
                pinchRef.current = {
                    distance: getTouchDistance(event.touches),
                    zoom: zoomRef.current,
                };
            }
        };

        const handleTouchMove = (event: TouchEvent) => {
            if (event.touches.length !== 2 || !pinchRef.current) return;
            event.preventDefault();
            const distance = getTouchDistance(event.touches);
            const ratio = distance / pinchRef.current.distance;
            applyZoom(pinchRef.current.zoom * ratio);
        };

        const handleTouchEnd = () => {
            pinchRef.current = null;
        };

        viewport.addEventListener('wheel', handleWheel, { passive: false });
        viewport.addEventListener('touchstart', handleTouchStart, {
            passive: true,
        });
        viewport.addEventListener('touchmove', handleTouchMove, {
            passive: false,
        });
        viewport.addEventListener('touchend', handleTouchEnd);
        viewport.addEventListener('touchcancel', handleTouchEnd);
        return () => {
            viewport.removeEventListener('wheel', handleWheel);
            viewport.removeEventListener('touchstart', handleTouchStart);
            viewport.removeEventListener('touchmove', handleTouchMove);
            viewport.removeEventListener('touchend', handleTouchEnd);
            viewport.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [applyZoom, isEnabled]);

    useEffect(() => {
        if (!isDragging) return undefined;
        const handleMouseMove = (event: MouseEvent) => {
            setOffset({
                x:
                    dragStartRef.current.offsetX +
                    (event.clientX - dragStartRef.current.x),
                y:
                    dragStartRef.current.offsetY +
                    (event.clientY - dragStartRef.current.y),
            });
        };
        const handleMouseUp = () => setIsDragging(false);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleMouseDown = useCallback(
        (event: React.MouseEvent) => {
            if (!isEnabled || zoomRef.current <= MIN_ZOOM) return;
            event.preventDefault();
            setIsDragging(true);
            dragStartRef.current = {
                x: event.clientX,
                y: event.clientY,
                offsetX: offset.x,
                offsetY: offset.y,
            };
        },
        [isEnabled, offset.x, offset.y],
    );

    const handleDoubleClick = useCallback(() => {
        if (!isEnabled) return;
        if (zoomRef.current > MIN_ZOOM) {
            resetZoom();
            return;
        }
        applyZoom(DEFAULT_ZOOM);
    }, [applyZoom, isEnabled, resetZoom]);

    return {
        zoom,
        offset,
        isDragging,
        viewportRef,
        zoomIn,
        zoomOut,
        resetZoom,
        handleMouseDown,
        handleDoubleClick,
    };
};

type Params = {
    closeLightbox: () => void;
};

type ImageGalleryFullscreen = ImageZoomPan & {
    overlayRef: React.RefObject<HTMLDivElement>;
    isFullScreen: boolean;
    toggleFullScreen: () => void;
    closeGallery: () => void;
};

export const useImageGalleryFullscreen = ({
    closeLightbox,
}: Params): ImageGalleryFullscreen => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const {
        zoom,
        offset,
        isDragging,
        viewportRef,
        zoomIn,
        zoomOut,
        resetZoom,
        handleMouseDown,
        handleDoubleClick,
    } = useImageZoomPan(isFullScreen);

    const exitNativeFullscreen = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => null);
        }
    }, []);

    const closeGallery = useCallback(() => {
        exitNativeFullscreen();
        setIsFullScreen(false);
        resetZoom();
        closeLightbox();
    }, [closeLightbox, exitNativeFullscreen, resetZoom]);

    const toggleFullScreen = useCallback(() => {
        if (isFullScreen) {
            exitNativeFullscreen();
            setIsFullScreen(false);
            resetZoom();
            return;
        }
        setIsFullScreen(true);
        overlayRef.current?.requestFullscreen?.().catch(() => null);
    }, [exitNativeFullscreen, isFullScreen, resetZoom]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullScreen(false);
                resetZoom();
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () =>
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange,
            );
    }, [resetZoom]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            // Native fullscreen already consumes Escape; `fullscreenchange` resets state.
            if (document.fullscreenElement) return;
            if (isFullScreen) {
                setIsFullScreen(false);
                resetZoom();
                return;
            }
            closeLightbox();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeLightbox, isFullScreen, resetZoom]);

    return {
        overlayRef,
        isFullScreen,
        toggleFullScreen,
        closeGallery,
        zoom,
        offset,
        isDragging,
        viewportRef,
        zoomIn,
        zoomOut,
        resetZoom,
        handleMouseDown,
        handleDoubleClick,
    };
};
