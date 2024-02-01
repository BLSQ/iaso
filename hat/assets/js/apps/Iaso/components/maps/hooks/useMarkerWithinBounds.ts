import { useState, useEffect } from 'react';
import L from 'leaflet';
import { ShortOrgUnit } from '../../../domains/orgUnits/types/orgUnit';

export const useMarkerWithinBounds = (
    latitude: number | undefined,
    longitude: number | undefined,
    geoJson: ShortOrgUnit['geo_json'],
): boolean => {
    const [isMarkerInside, setIsMarkerInside] = useState(true);

    useEffect(() => {
        if (geoJson && latitude !== undefined && longitude !== undefined) {
            const bounds = L.geoJSON(geoJson).getBounds();
            setIsMarkerInside(bounds.contains(L.latLng(latitude, longitude)));
        }
    }, [latitude, longitude, geoJson]);

    return isMarkerInside;
};
