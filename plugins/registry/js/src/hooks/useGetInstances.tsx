import { UseQueryResult } from 'react-query';
import { getSort } from 'bluesquare-components';
import { getRequest } from '../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    Instance,
    PaginatedInstances,
} from '../../../../../hat/assets/js/apps/Iaso/domains/instances/types/instance';
import { makeUrlWithParams } from '../../../../../hat/assets/js/apps/Iaso/libs/utils';
import { OrgUnitStatus } from '../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { RegistryParams } from '../types';

export const defaultSorted = [{ id: 'org_unit__name', desc: false }];

type ApiParams = {
    orgUnitTypeId?: number;
    form_ids?: string;
    limit: string;
    order: string;
    page: string;
    showDeleted: false;
    orgUnitParentId: string;
    org_unit_status?: OrgUnitStatus;
    planning_ids?: string;
    registry_slug: string;
};

type InstanceApi = {
    url: string;
    apiParams: ApiParams;
};

export const useGetInstanceApi = (
    params: RegistryParams,
    registrySlug: string,
    orgUnitTypeId?: number,
    orgUnitStatus?: OrgUnitStatus,
): InstanceApi => {
    const {
        pageSize = '20',
        order = getSort(defaultSorted) || '-name',
        page = '1',
        formIds,
        orgUnitId,
        planningIds,
    } = params;

    const apiParams: ApiParams = {
        orgUnitTypeId,
        form_ids: formIds,
        limit: pageSize,
        order,
        page,
        showDeleted: false,
        orgUnitParentId: orgUnitId,
        org_unit_status: orgUnitStatus,
        planning_ids: planningIds,
        registry_slug: registrySlug,
    };
    const url = makeUrlWithParams(
        '/api/public/registry/instances/',
        apiParams as Record<string, any>,
    );
    return {
        apiParams,
        url,
    };
};

export const useGetInstances = (
    params: RegistryParams,
    registrySlug: string,
    orgUnitTypeId?: number,
): UseQueryResult<PaginatedInstances, Error> => {
    const { apiParams, url } = useGetInstanceApi(
        params,
        registrySlug,
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
    registrySlug: string,
    orgUnitId?: number,
    onlyReference = false,
): UseQueryResult<Instance[], Error> => {
    const apiParams: Record<string, any> = {
        orgUnitId,
        showDeleted: false,
        onlyReference,
        registry_slug: registrySlug,
    };
    const url = makeUrlWithParams('/api/public/registry/instances/', apiParams);
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
    registrySlug: string,
    keepPreviousData = true,
): UseQueryResult<Instance, Error> => {
    return useSnackQuery({
        queryKey: ['instance', instanceId],
        queryFn: () =>
            getRequest(
                `/api/public/registry/instances/${instanceId}/?registry_slug=${registrySlug}`,
            ),
        options: {
            enabled: Boolean(instanceId),
            retry: false,
            keepPreviousData,
        },
    });
};
