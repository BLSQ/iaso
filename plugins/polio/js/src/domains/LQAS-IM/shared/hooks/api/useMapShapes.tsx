import { useMemo } from 'react';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { MapShapes } from '../../../../../constants/types';
import { useGetGeoJson } from '../../../../Campaigns/Scope/hooks/useGetGeoJson';
import { appId } from '../../../../../constants/app';

const defaultShapes: OrgUnit[] = [];
export const useMapShapes = (
    countryId?: number,
    isEmbedded = false,
): MapShapes => {
    const { data: shapes = defaultShapes, isFetching: isFetchingGeoJson } =
        useGetGeoJson({
            topParentId: countryId,
            orgUnitCategory: 'DISTRICT',
            appId: isEmbedded ? appId : undefined,
        });
    const {
        data: regionShapes = defaultShapes,
        isFetching: isFetchingRegions,
    } = useGetGeoJson({
        topParentId: countryId,
        orgUnitCategory: 'REGION',
        appId: isEmbedded ? appId : undefined,
    });

    return useMemo(() => {
        return {
            shapes,
            isFetchingGeoJson,
            regionShapes,
            isFetchingRegions,
        };
    }, [isFetchingGeoJson, isFetchingRegions, regionShapes, shapes]);
};
