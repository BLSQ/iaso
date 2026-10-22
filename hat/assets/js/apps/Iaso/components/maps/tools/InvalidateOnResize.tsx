import { FC, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

/**
 * Calls `map.invalidateSize()` whenever the map container is resized.
 * When `bounds` is provided, also re-fits the map view after resize (debounced)
 * so it stays centered when the container width/height changes.
 */
export const InvalidateOnResize: FC<{
    bounds?: L.LatLngBounds;
    boundsOptions?: L.FitBoundsOptions;
}> = ({ bounds, boundsOptions }) => {
    const map = useMap();
    const boundsRef = useRef(bounds);
    const boundsOptionsRef = useRef(boundsOptions);

    useEffect(() => {
        boundsRef.current = bounds;
    }, [bounds]);

    useEffect(() => {
        boundsOptionsRef.current = boundsOptions;
    }, [boundsOptions]);

    useEffect(() => {
        const container = map.getContainer();
        let timeoutId: ReturnType<typeof setTimeout>;
        const observer = new ResizeObserver(() => {
            map.invalidateSize();
            if (boundsRef.current) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    if (boundsRef.current) {
                        map.fitBounds(
                            boundsRef.current,
                            boundsOptionsRef.current ?? {},
                        );
                    }
                }, 150);
            }
        });
        observer.observe(container);
        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [map]);

    return null;
};
