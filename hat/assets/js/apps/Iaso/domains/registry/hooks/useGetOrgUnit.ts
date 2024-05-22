import { UseQueryResult } from 'react-query';

import { Pagination } from 'bluesquare-components';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

import { makeUrlWithParams } from '../../../libs/utils';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';
import { RegistryParams } from '../types';

export const useGetOrgUnit = (
    orgUnitId?: string,
): UseQueryResult<OrgUnit, Error> => {
    const queryKey: any[] = ['orgUnit', orgUnitId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(`/api/orgunits/${orgUnitId}/`),
        options: {
            retry: false,
            enabled: Boolean(orgUnitId),
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};

export type OrgUnitListChildren = Pagination & {
    orgunits: OrgUnit[];
};

export const useGetOrgUnitListChildren = (
    orgUnitParentId: string,
    params: RegistryParams,
    orgUnitTypes?: OrgunitTypes,
): UseQueryResult<OrgUnitListChildren, Error> => {
    let order = '-name';
    if (params.orgUnitListOrder) {
        if (params.orgUnitListOrder === 'location') {
            order = 'location,simplified_geom';
        } else if (params.orgUnitListOrder === '-location') {
            order = '-location,-simplified_geom';
        } else {
            order = params.orgUnitListOrder;
        }
    }
    const apiParams: Record<string, any> = {
        validation_status: 'VALID',
        orgUnitParentId,
        onlyDirectChildren: true,
        limit: params.orgUnitListPageSize || '10',
        order,
        page: params.orgUnitListPage || '1',
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
): UseQueryResult<OrgUnit[], Error> => {
    const params: Record<string, any> = {
        validation_status: 'VALID',
        orgUnitParentId,
        withShapes: true,
        onlyDirectChildren: true,
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
