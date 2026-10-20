import { useCallback, useState } from 'react';
import { PaginationType } from 'bluesquare-components';
import { UseQueryResult, useQueryClient } from 'react-query';

import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

import { makeUrlWithParams } from '../../../libs/utils';
import { TREEVIEW_ORG_UNIT_FIELDS } from '../../orgUnits/components/TreeView/requests';
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
                // Only used to find the ancestors to expand in the treeview.
                const url = makeUrlWithParams(`/api/orgunits/${orgUnit.id}/`, {
                    app_id: appId || undefined,
                    fields: TREEVIEW_ORG_UNIT_FIELDS,
                });
                const result = await queryClient.fetchQuery<OrgUnit>(
                    ['orgUnit', orgUnit.id, TREEVIEW_ORG_UNIT_FIELDS],
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
        [appId, queryClient],
    );

    return { fetchOrgUnit, isFetching };
};

// What the registry page shows (title, breadcrumbs, map, sub types, reference
// submission); leaving out instances_count and catchment skips their
// computation on the backend.
export const REGISTRY_ORG_UNIT_FIELDS =
    'id,name,org_unit_type,org_unit_type_name,validation_status,parent,geo_json,latitude,longitude,reference_instances';

export const useGetOrgUnit = (
    orgUnitId?: string,
): UseQueryResult<OrgUnit, Error> => {
    const queryKey: any[] = ['orgUnit', orgUnitId, REGISTRY_ORG_UNIT_FIELDS];
    return useSnackQuery({
        queryKey,
        queryFn: () =>
            getRequest(
                `/api/orgunits/${orgUnitId}/?fields=${REGISTRY_ORG_UNIT_FIELDS}`,
            ),
        options: {
            retry: false,
            enabled: Boolean(orgUnitId),
            keepPreviousData: Boolean(orgUnitId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};

export type OrgUnitListChildren = PaginationType & {
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
                    (orgUnit: OrgUnit) =>
                        `${orgUnitParentId}` !== `${orgUnit.id}`,
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
