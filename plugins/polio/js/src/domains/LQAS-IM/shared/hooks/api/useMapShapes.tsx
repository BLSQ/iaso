import { useMemo } from 'react';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { MapShapes } from '../../../../../constants/types';
import { useGetGeoJson } from '../../../../Campaigns/Scope/hooks/useGetGeoJson';

const defaultShapes: OrgUnit[] = [];
export const useMapShapes = (countryId?: number): MapShapes => {
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
