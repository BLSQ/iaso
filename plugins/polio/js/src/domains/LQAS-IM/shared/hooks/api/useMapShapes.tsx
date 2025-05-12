import { useMemo } from 'react';
import { useGetGeoJson } from '../../../../Campaigns/Scope/hooks/useGetGeoJson';

const defaultShapes = [];
export const useMapShapes = (countryId?: number) => {
    const { data: shapes = defaultShapes, isFetching: isFetchingGeoJson } =
        useGetGeoJson(countryId, 'DISTRICT');
    const {
        data: regionShapes = defaultShapes,
        isFetching: isFetchingRegions,
    } = useGetGeoJson(countryId, 'REGION');

    return useMemo(() => {
        return {
            shapes,
            isFetchingGeoJson,
            regionShapes,
            isFetchingRegions,
        };
    }, [isFetchingGeoJson, isFetchingRegions, regionShapes, shapes]);
};
