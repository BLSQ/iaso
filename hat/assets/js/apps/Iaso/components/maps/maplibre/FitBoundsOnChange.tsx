import { FC, useEffect, useRef } from 'react';
import { LngLatBounds } from 'maplibre-gl';
import { useMap } from 'react-map-gl/maplibre';
import { FIT_BOUNDS_PADDING } from './FitBoundsControl';

type Props = {
    bounds?: LngLatBounds;
    fitKey: unknown;
};

// Fits the map each time fitKey changes, as soon as the matching bounds are known.
// The initial key is skipped: the map is already created on its bounds.
export const FitBoundsOnChange: FC<Props> = ({ bounds, fitKey }) => {
    const { current: map } = useMap();
    const fittedKey = useRef(fitKey);
    useEffect(() => {
        if (!map || !bounds || fittedKey.current === fitKey) return;
        fittedKey.current = fitKey;
        map.fitBounds(bounds, { padding: FIT_BOUNDS_PADDING });
    }, [map, bounds, fitKey]);
    return null;
};
