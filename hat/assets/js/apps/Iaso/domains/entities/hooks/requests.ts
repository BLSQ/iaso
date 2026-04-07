import { UrlParams } from 'bluesquare-components';
import moment from 'moment';
import { UseMutationResult, UseQueryResult } from 'react-query';
import { ParamsWithAccountId } from 'Iaso/routing/hooks/useParamsObject';
import { apiDateFormat } from 'Iaso/utils/dates';
import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
} from '../../../libs/Api';
import { useSnackMutation, useSnackQuery } from '../../../libs/apiHooks';

import { makeUrlWithParams } from '../../../libs/utils';

import { DropdownOptions } from '../../../types/utils';
import { PaginatedInstances } from '../../instances/types/instance';
import { Location } from '../components/ListMap';
import { EntityType } from '../entityTypes/types/entityType';
import MESSAGES from '../messages';
import { Entity } from '../types/entity';
import { ExtraColumn } from '../types/fields';
import { Params } from '../types/filters';
import { DisplayedLocation } from '../types/locations';

export interface PaginatedEntities {
    result: Array<Entity>;
    columns: Array<ExtraColumn>;
    /** Cursor pagination tokens from `/api/entities/` when using `cursor` query param. */
    next?: string | null;
    previous?: string | null;
}

type ApiParams = {
    limit?: string;
    order_columns: string;
    page?: string;
    search?: string;
    orgUnitId?: string;
    dateFrom?: string;
    dateTo?: string;
    created_by_team_id?: string;
    created_by_id?: string;
    entity_type_ids?: string;
    asLocation?: string;
    locationLimit?: string;
    groups?: string;
    tab: string;
    fields_search?: string;
    cursor?: string;
};

type GetAPiParams = {
    url: string;
    apiParams: ApiParams;
};
export const useGetEntitiesApiParams = (
    params: Params,
    asLocation = false,
    cursorPagination = false,
): GetAPiParams => {
    const apiParams: ApiParams = {
        order_columns: params.order || 'id',
        search: params.search,
        orgUnitId: params.location,
        dateFrom:
            params.dateFrom &&
            moment(params.dateFrom, 'DD-MM-YYYY').format(apiDateFormat),
        dateTo:
            params.dateTo &&
            moment(params.dateTo, 'DD-MM-YYYY').format(apiDateFormat),
        created_by_id: params.submitterId,
        created_by_team_id: params.submitterTeamId,
        entity_type_ids: params.entityTypeIds,
        limit: params.pageSize || '20',
        page: params.page || '1',
        groups: params.groups,
        tab: params.tab || 'list',
        fields_search: params.fieldsSearch,
    };
    if (cursorPagination) {
        apiParams.cursor = params.cursor || 'null';
    }
    if (asLocation) {
        apiParams.asLocation = 'true';
        apiParams.limit = params.locationLimit || '1000';
    }
    const url = makeUrlWithParams('/api/entities/', apiParams);
    return {
        url,
        apiParams,
    };
};

export const useGetEntitiesPaginated = (
    params: Params,
    isEnabled: boolean,
): UseQueryResult<PaginatedEntities, Error> => {
    const { url, apiParams } = useGetEntitiesApiParams(params, false, true);
    return useSnackQuery({
        queryKey: ['entities', apiParams],
        queryFn: () => getRequest(url),
        options: {
            enabled: apiParams.tab === 'list' && isEnabled,
            staleTime: 60000,
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};
export const useGetEntitiesLocations = (
    params: Params,
    displayedLocation: DisplayedLocation,
): UseQueryResult<Array<Location>, Error> => {
    const { url, apiParams } = useGetEntitiesApiParams(params, true);
    return useSnackQuery({
        queryKey: ['entitiesLocations', apiParams],
        queryFn: () => getRequest(url),
        options: {
            enabled: apiParams.tab === 'map',
            staleTime: 60000,
            select: data =>
                data?.result?.map((entity: Entity) => ({
                    latitude:
                        displayedLocation === 'submissions'
                            ? entity.latitude
                            : entity.org_unit?.latitude,
                    longitude:
                        displayedLocation === 'submissions'
                            ? entity.longitude
                            : entity.org_unit?.longitude,
                    orgUnit: entity.org_unit,
                    id: entity.id,
                    original: {
                        ...entity,
                    },
                })) || [],
        },
    });
};

export const useGetEntitiesCount = (
    params: Params,
    hasCursor: boolean,
): UseQueryResult<{ count: number }, Error> => {
    // strip attributes that shouldn't affect the count cache or api
    const {
        cursor: _cursor,
        page: _page,
        pageSize: _pageSize,
        order: _order,
        ...countParams
    } = params;

    const { url, apiParams } = useGetEntitiesApiParams(
        countParams as Params,
        false,
        true,
    );
    const countUrl = url.replace('/entities/', '/entities/count/');

    return useSnackQuery({
        queryKey: ['entities-count', countParams],
        queryFn: () => getRequest(countUrl),
        options: {
            enabled: hasCursor && apiParams.tab === 'list',
            staleTime: 1000 * 60 * 5,
            cacheTime: 1000 * 60 * 10,
        },
    });
};

export const useGetEntityTypesDropdown = (): UseQueryResult<
    Array<DropdownOptions<number>>,
    Error
> =>
    useSnackQuery({
        queryKey: ['entityTypesOptions'],
        queryFn: () => getRequest('/api/entitytypes/?order=name'),
        options: {
            staleTime: Infinity,
            cacheTime: 1000 * 60 * 5,
            select: data =>
                data?.map((type: EntityType) => ({
                    label: type.name,
                    value: type.id,
                    original: type,
                })),
        },
    });

export const useSoftDeleteEntity = (
    onSuccess: (data: any) => void = _data => {},
): UseMutationResult =>
    useSnackMutation({
        mutationFn: entityId => deleteRequest(`/api/entities/${entityId}/`),
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        invalidateQueryKey: ['entities'],
        options: { onSuccess },
    });

export const useSaveEntity = (): UseMutationResult =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/entities/${body.id}/`, body)
                : postRequest('/api/entities/', body),
        undefined,
        undefined,
        ['entities'],
    );

const getEntity = (entityId: string | undefined): Promise<Entity> => {
    return getRequest(`/api/entities/${entityId}/`);
};
export const useGetEntity = (
    entityId: string | undefined,
): UseQueryResult<Entity, Error> => {
    const queryKey: any[] = ['entity', entityId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getEntity(entityId),
        options: {
            retry: false,
            staleTime: Infinity,
        },
    });
};

const getSubmissions = (
    { pageSize, order, page }: Partial<UrlParams>,
    entityId?: number,
): Promise<PaginatedInstances> => {
    const baseUrl = '/api/instances/';
    const apiParams = {
        limit: pageSize || 20,
        order,
        page,
        entityId,
    };

    const url = makeUrlWithParams(baseUrl, apiParams);
    return getRequest(url) as Promise<PaginatedInstances>;
};

export const useGetSubmissions = (
    params: Partial<UrlParams> & ParamsWithAccountId,
    entityId: number,
): UseQueryResult<PaginatedInstances, Error> => {
    if (!params.order) {
        params.order = 'source_created_at';
    }
    return useSnackQuery({
        queryKey: ['submissionsForEntity', entityId, params],
        queryFn: () => getSubmissions(params, entityId),
        options: {
            retry: false,
            enabled: Boolean(entityId),
            keepPreviousData: true,
            cacheTime: 1000 * 60 * 5,
            staleTime: 1000 * 60 * 5,
        },
    });
};
