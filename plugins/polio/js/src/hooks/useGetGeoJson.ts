// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import _ from 'lodash';
import { UseQueryResult } from 'react-query';

type Params = {
    // eslint-disable-next-line camelcase
    validation_status: string;
    withShapes?: 'true' | 'false';
    order: string;
    orgUnitTypeCategory: string;
    orgUnitParentId?: string;
    asLocation?: 'true' | 'false';
    limit?: string;
};

export const useGetGeoJson = (
    topParentId: number | undefined,
    orgUnitCategory: string,
): UseQueryResult<any> => {
    const params: Params = {
        validation_status: 'all',
        withShapes: 'true',
        order: 'id',
        orgUnitTypeCategory: orgUnitCategory,
    };
    if (_.isNumber(topParentId)) {
        params.orgUnitParentId = `${topParentId}`;
    }

    const urlParams = new URLSearchParams(params);

    return useSnackQuery(
        ['geo_json', params],
        () => getRequest(`/api/orgunits/?${urlParams.toString()}`),
        undefined,
        {
            enabled: Boolean(topParentId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data => data?.orgUnits,
        },
    );
};

export const useGetCountriesGeoJson = (
    enabled: boolean,
): UseQueryResult<any> => {
    const params: Params = {
        validation_status: 'all',
        asLocation: 'true',
        limit: '3000',
        order: 'id',
        orgUnitTypeCategory: 'COUNTRY',
    };

    const queryString = new URLSearchParams(params);

    return useSnackQuery(
        ['geo_json', params],
        () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        undefined,
        {
            enabled,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    );
};
