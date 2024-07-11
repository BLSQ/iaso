import { UseQueryResult } from 'react-query';

import { Pagination } from 'bluesquare-components';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { OrgUnit } from '../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgunitTypes';
import { makeUrlWithParams } from '../../../../../hat/assets/js/apps/Iaso/libs/utils';
import { RegistryParams } from '../types';

export const useGetOrgUnit = (
    appId?: string,
    orgUnitId?: string,
): UseQueryResult<OrgUnit, Error> => {
    const queryKey: any[] = ['orgUnit', orgUnitId];
    return useSnackQuery({
        queryKey,
        queryFn: () =>
            getRequest(`/api/orgunits/${orgUnitId}/?app_id=${appId}`),
        options: {
            retry: false,
            enabled: Boolean(orgUnitId),
            keepPreviousData: Boolean(orgUnitId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};

export type OrgUnitListChildren = Pagination & {
    orgunits: OrgUnit[];
};

const getOrder = (orgUnitListOrder?: string): string => {
    if (!orgUnitListOrder) return '-name';
    if (orgUnitListOrder === 'location') return 'location,simplified_geom';
    if (orgUnitListOrder === '-location') return '-location,-simplified_geom';
    return orgUnitListOrder;
};

export const useGetOrgUnitListChildren = (
    orgUnitParentId: string,
    params: RegistryParams,
    orgUnitTypes?: OrgunitTypes,
    appId?: string,
): UseQueryResult<OrgUnitListChildren, Error> => {
    const order = getOrder(params.orgUnitListOrder);
    const apiParams: Record<string, any> = {
        validation_status: 'VALID',
        orgUnitParentId,
        onlyDirectChildren: true,
        limit: params.orgUnitListPageSize || '10',
        order,
        page: params.orgUnitListPage || '1',
        app_id: appId,
    };
    if (orgUnitTypes && orgUnitTypes.length > 0) {
        apiParams.orgUnitTypeId = orgUnitTypes
            .map(orgunitType => orgunitType.id)
            .join(',');
    }

    const url = makeUrlWithParams('/api/orgunits/', apiParams);
    return useSnackQuery({
        queryKey: ['orgUnits', apiParams],
        queryFn: () => getRequest(url),
        options: {
            keepPreviousData: true,
            enabled: Boolean(orgUnitParentId && orgUnitTypes),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data => {
                if (!data) return undefined;
                const orgunits: OrgUnit[] = data.orgunits.filter(
                    orgUnit => `${orgUnitParentId}` !== `${orgUnit.id}`,
                );
                return {
                    ...data,
                    orgunits,
                };
            },
        },
    });
};

type Result = {
    orgUnits: OrgUnit[];
};
export const useGetOrgUnitsMapChildren = (
    orgUnitParentId: string,
    orgUnitTypes?: OrgunitTypes,
    appId?: string,
): UseQueryResult<OrgUnit[], Error> => {
    const params: Record<string, any> = {
        validation_status: 'VALID',
        orgUnitParentId,
        withShapes: true,
        onlyDirectChildren: true,
        app_id: appId,
    };
    if (orgUnitTypes && orgUnitTypes.length > 0) {
        params.orgUnitTypeId = orgUnitTypes
            .map(orgunitType => orgunitType.id)
            .join(',');
    }
    const url = makeUrlWithParams('/api/orgunits/', params);
    return useSnackQuery({
        queryKey: ['orgUnits', params],
        queryFn: () => getRequest(url),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            enabled: Boolean(orgUnitParentId && orgUnitTypes),
            select: (data: Result): OrgUnit[] => data?.orgUnits || [],
        },
    });
};
