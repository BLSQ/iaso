import _ from 'lodash';
import { UseQueryResult } from 'react-query';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { cleanupParams } from 'bluesquare-components';

type Params = {
    // eslint-disable-next-line camelcase
    validation_status: string;
    withShapes?: 'true' | 'false';
    order: string;
    orgUnitTypeCategory: string;
    orgUnitParentId?: string;
    asLocation?: 'true' | 'false';
    limit?: string;
    app_id?: string;
};

type Args = {
    topParentId: number | undefined;
    orgUnitCategory: string;
    validationStatus?: string;
    appId?: string;
};
export const useGetGeoJson = ({
    topParentId,
    orgUnitCategory,
    validationStatus = 'all',
    appId,
}: Args): UseQueryResult<OrgUnit[]> => {
    const params: Params = {
        validation_status: validationStatus,
        withShapes: 'true',
        order: 'id',
        orgUnitTypeCategory: orgUnitCategory,
        app_id: appId,
    };
    if (_.isNumber(topParentId)) {
        params.orgUnitParentId = `${topParentId}`;
    }

    const urlParams = new URLSearchParams(cleanupParams(params));

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
