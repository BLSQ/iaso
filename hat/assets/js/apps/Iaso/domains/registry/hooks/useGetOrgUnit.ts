import { UseQueryResult, useQueryClient } from 'react-query';

import { Pagination } from 'bluesquare-components';
import { useCallback, useState } from 'react';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

import { makeUrlWithParams } from '../../../libs/utils';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';
import { RegistryParams } from '../types';

type FetchOrgUnitsListResult = {
    isFetching: boolean;
    fetchOrgUnit: (orgUnit: OrgUnit) => Promise<OrgUnit | Error>;
};

export const useFetchOrgUnits = (appId?: string): FetchOrgUnitsListResult => {
    const queryClient = useQueryClient();
    const [isFetching, setIsFetching] = useState(false);

    const fetchOrgUnit = useCallback(
        async (orgUnit: OrgUnit): Promise<OrgUnit | Error> => {
            setIsFetching(true);
            try {
                let url = `/api/orgunits/${orgUnit.id}/`;
                if (appId) {
                    url += `?app_id=${appId}`;
                }
                const result = await queryClient.fetchQuery<OrgUnit>(
                    ['orgUnit', orgUnit.id],
                    () => getRequest(url),
                    {
                        staleTime: 1000 * 60 * 5, // Example: 5 minutes stale time
                    },
                );
                setIsFetching(false);
                return result;
            } catch (error) {
                setIsFetching(false);
                console.error('Error fetching org unit:', error);
                return new Error(
                    `Failed to fetch org unit with ID ${orgUnit.id}: ${error.message}`,
                );
            }
        },
        [queryClient],
    );

    return { fetchOrgUnit, isFetching };
};

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
            keepPreviousData: Boolean(orgUnitId),
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
