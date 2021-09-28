import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

export const useGetGeoJson = (country, orgUnitCategory) => {
    const baseParams = {
        validation_status: 'all',
        asLocation: true,
        limit: 3000,
        order: 'id',
        orgUnitParentId: country,
    };
    const districtParam = {
        orgUnitTypeCategory: 'DISTRICT',
    };
    const provinceParam = {
        orgUnitTypeId: 6,
    };
    const params =
        orgUnitCategory === 'DISTRICT'
            ? { ...baseParams, ...districtParam }
            : { ...baseParams, ...provinceParam };
    const queryString = new URLSearchParams(params);

    return useSnackQuery(
        ['geo_json', params],
        () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        undefined,
        {
            enabled: Boolean(country),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    );
};
