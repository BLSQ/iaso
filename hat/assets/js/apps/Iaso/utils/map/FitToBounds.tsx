import L from 'leaflet';
import { FunctionComponent, useEffect } from 'react';
import { useMap } from 'react-leaflet';

type Props = {
    bounds: L.LatLngBounds;
    options?: L.FitBoundsOptions;
    triggerId: string;
};

export const FitToBounds: FunctionComponent<Props> = ({
    bounds,
    options,
    triggerId,
}) => {
    const map = useMap();

    useEffect(() => {
        if (bounds.isValid()) {
            map.fitBounds(bounds, options);
        }
    }, [triggerId]);

    return null;
};
