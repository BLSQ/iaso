import { getSort } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

import { makeUrlWithParams } from '../../../libs/utils';
import { Instance, PaginatedInstances } from '../../instances/types/instance';

import { OrgUnitStatus } from '../../orgUnits/types/orgUnit';
import { defaultSorted } from '../config';
import { RegistryParams } from '../types';

type ApiParams = {
    orgUnitTypeId?: number;
    form_ids?: string;
    limit: string;
    order: string | undefined;
    page: string;
    showDeleted: false;
    orgUnitParentId: string;
    org_unit_status?: OrgUnitStatus;
    planning_ids?: string;
    project_ids?: string;
    periodType?: string;
    startPeriod?: string;
    endPeriod?: string;
};

type InstanceApi = {
    url: string;
    apiParams: ApiParams;
};

export const useGetInstanceApi = (
    params: RegistryParams,
    orgUnitTypeId?: number,
    orgUnitStatus?: OrgUnitStatus,
): InstanceApi => {
    const apiParams: ApiParams = {
        orgUnitTypeId,
        form_ids: params.formIds,
        limit: params.pageSize || '20',
        order: params.order || getSort(defaultSorted),
        page: params.page || '1',
        showDeleted: false,
        orgUnitParentId: params.orgUnitId,
        org_unit_status: orgUnitStatus,
        planning_ids: params.planningIds,
        project_ids: params.projectIds,
    };
    const url = makeUrlWithParams(
        '/api/instances/',
        apiParams as Record<string, any>,
    );
    return {
        apiParams,
        url,
    };
};

export const useGetInstances = (
    params: RegistryParams,
    orgUnitTypeId?: number,
): UseQueryResult<PaginatedInstances, Error> => {
    const { apiParams, url } = useGetInstanceApi(
        params,
        orgUnitTypeId,
        'VALID',
    );
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
    onlyReference = false,
): UseQueryResult<Instance[], Error> => {
    const apiParams: Record<string, any> = {
        orgUnitId,
        showDeleted: false,
        onlyReference,
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
    keepPreviousData = true,
): UseQueryResult<Instance, Error> => {
    return useSnackQuery({
        queryKey: ['instance', instanceId],
        queryFn: () => getRequest(`/api/instances/${instanceId}/`),
        options: {
            enabled: Boolean(instanceId),
            retry: false,
            keepPreviousData,
        },
    });
};
