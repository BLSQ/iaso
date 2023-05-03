import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getSort } from 'bluesquare-components';

import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

import { PaginatedInstances, Instance } from '../../instances/types/instance';
import { makeUrlWithParams } from '../../../libs/utils';

import { RegistryDetailParams } from '../types';
import { defaultSorted } from '../config';

export const useGetInstances = (
    params: RegistryDetailParams,
    orgUnitTypeId?: number,
): UseQueryResult<PaginatedInstances, Error> => {
    const apiParams: Record<string, any> = {
        orgUnitTypeId,
        form_ids: params.formIds,
        limit: params.pageSize || 20,
        order: params.order || getSort(defaultSorted),
        page: params.page || 1,
        showDeleted: false,
        orgUnitParentId: params.orgUnitId,
    };
    const url = makeUrlWithParams('/api/instances/', apiParams);
    return useSnackQuery({
        queryKey: ['registry-instances', apiParams],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(orgUnitTypeId && params.formIds),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};

export const useGetOrgUnitInstances = (
    orgUnitId?: number,
): UseQueryResult<Instance[], Error> => {
    const apiParams: Record<string, any> = {
        orgUnitId,
        showDeleted: false,
    };
    const url = makeUrlWithParams('/api/instances/', apiParams);
    return useSnackQuery({
        queryKey: ['registry-org-unit-instances', apiParams],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(orgUnitId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data => data?.instances,
        },
    });
};

export const useGetInstance = (
    instanceId: number | string | undefined,
): UseQueryResult<Instance, Error> => {
    return useSnackQuery({
        queryKey: ['instance', instanceId],
        queryFn: () => getRequest(`/api/instances/${instanceId}/`),
        options: {
            enabled: Boolean(instanceId),
            retry: false,
            keepPreviousData: true,
        },
    });
};
