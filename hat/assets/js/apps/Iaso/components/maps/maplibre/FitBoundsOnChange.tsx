import { FC, useEffect, useRef } from 'react';
import { LngLatBounds } from 'maplibre-gl';
import { useMap } from 'react-map-gl/maplibre';
import { FIT_BOUNDS_PADDING } from './FitBoundsControl';

type Props = {
    bounds?: LngLatBounds;
    fitKey: unknown;
    // Keeps small bounds, like a single point, from zooming all the way in.
    maxZoom?: number;
    // Also fits on the initial key, when the map was created on other bounds.
    fitInitialKey?: boolean;
};

// Fits the map each time fitKey changes, as soon as the matching bounds are known.
// By default the initial key is skipped: the map is already created on its bounds.
export const FitBoundsOnChange: FC<Props> = ({
    bounds,
    fitKey,
    maxZoom,
    fitInitialKey = false,
}) => {
    const { current: map } = useMap();
    const fittedKey = useRef(fitInitialKey ? undefined : fitKey);
    useEffect(() => {
        if (!map || !bounds || fittedKey.current === fitKey) return;
        fittedKey.current = fitKey;
        // An explicit undefined maxZoom overrides MapLibre's default and makes the camera NaN.
        map.fitBounds(bounds, {
            padding: FIT_BOUNDS_PADDING,
            ...(maxZoom !== undefined && { maxZoom }),
        });
    }, [map, bounds, fitKey, maxZoom]);
    return null;
};
