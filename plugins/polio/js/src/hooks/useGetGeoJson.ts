import { UseQueryResult } from 'react-query';

// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { OrgUnit } from '../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { PaginationParams } from '../../../../../hat/assets/js/apps/Iaso/types/general';

export const useGetGeoJson = (
    topParentId: number | undefined,
    orgUnitCategory: string,
): UseQueryResult<OrgUnit[], Error> => {
    const params = {
        validation_status: 'all',
        asLocation: 'true',
        limit: '3000',
        order: 'id',
        orgUnitParentId: `${topParentId}`,
        orgUnitTypeCategory: orgUnitCategory,
    };

    const queryString = new URLSearchParams(params);

    return useSnackQuery(
        ['geo_json', params],
        () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        undefined,
        {
            enabled: Boolean(topParentId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    );
};

type Params = PaginationParams & {
    search?: string;
};
type ApiParams = {
    search?: string;
    limit: string;
    order: string;
    page: string;
    validationStatus: string;
    orgUnitParentId: string;
    orgUnitTypeCategory: string;
};

export const useGetDistrictList = (
    topParentId: number | undefined,
    params: Params,
): UseQueryResult<OrgUnit[], Error> => {
    const apiParams: ApiParams = {
        limit: params.pageSize || '10',
        order: params.order || 'id',
        page: params.page || '1',
        validationStatus: 'all',
        orgUnitParentId: `${topParentId}`,
        orgUnitTypeCategory: 'DISTRICT',
    };
    if (params.search && params.search !== '') {
        apiParams.search = params.search;
    }

    const queryString = new URLSearchParams(apiParams);

    return useSnackQuery(
        ['geo_json', apiParams],
        () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        undefined,
        {
            enabled: Boolean(topParentId),
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    );
};
