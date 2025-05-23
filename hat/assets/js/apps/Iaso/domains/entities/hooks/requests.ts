// @ts-ignore
import { Pagination, UrlParams } from 'bluesquare-components';
import moment from 'moment';
import { UseMutationResult, UseQueryResult } from 'react-query';
import { ParamsWithAccountId } from 'Iaso/routing/hooks/useParamsObject';
import { apiDateFormat } from 'Iaso/utils/dates.ts';
import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
} from '../../../libs/Api';
import { useSnackMutation, useSnackQuery } from '../../../libs/apiHooks';

import { makeUrlWithParams } from '../../../libs/utils';

import { DropdownOptions } from '../../../types/utils';
import getDisplayName, { Profile } from '../../../utils/usersUtils';
import { PaginatedInstances } from '../../instances/types/instance';
import { DropdownTeamsOptions, Team } from '../../teams/types/team';
import { Location } from '../components/ListMap';
import MESSAGES from '../messages';
import { Entity } from '../types/entity';
import { ExtraColumn } from '../types/fields';
import { Params } from '../types/filters';
import { DisplayedLocation } from '../types/locations';

export interface PaginatedEntities extends Pagination {
    result: Array<Entity>;
    columns: Array<ExtraColumn>;
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
};

type GetAPiParams = {
    url: string;
    apiParams: ApiParams;
};
export const useGetEntitiesApiParams = (
    params: Params,
    asLocation = false,
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
): UseQueryResult<PaginatedEntities, Error> => {
    const { url, apiParams } = useGetEntitiesApiParams(params);
    return useSnackQuery({
        queryKey: ['entities', apiParams],
        queryFn: () => getRequest(url),
        options: {
            enabled: apiParams.tab === 'list',
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
                data?.result?.map(entity => ({
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

export const useGetEntityTypesDropdown = (): UseQueryResult<
    Array<DropdownOptions<number>>,
    Error
> =>
    useSnackQuery({
        queryKey: ['entityTypesOptions'],
        queryFn: () => getRequest('/api/entitytypes/?order=name'),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data =>
                data?.map(type => ({
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

export const useGetUsersDropDown = (
    team?: Team,
): UseQueryResult<DropdownOptions<number>[], Error> => {
    return useSnackQuery(
        ['profiles', team],
        () => getRequest('/api/profiles/'),
        MESSAGES.projectsError,
        {
            select: data => {
                if (!data) return [];
                if (team) {
                    return data.profiles
                        ?.filter((profile: Profile) => {
                            return Boolean(
                                team.users_details.find(
                                    userProfile =>
                                        userProfile.username ===
                                        profile.user_name,
                                ),
                            );
                        })
                        .map((profile: Profile) => {
                            return {
                                value: profile.user_id,
                                label: getDisplayName(profile),
                            };
                        });
                }
                return data.profiles.map((profile: Profile) => {
                    return {
                        value: profile.user_id,
                        label: getDisplayName(profile),
                    };
                });
            },
        },
    );
};

const getTeams = async (): Promise<Team[]> => {
    return getRequest('/api/microplanning/teams/') as Promise<Team[]>;
};

export const useGetTeamsDropdown = (): UseQueryResult<
    DropdownTeamsOptions[],
    Error
> => {
    const queryKey: any[] = ['teamsList'];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getTeams(),
        options: {
            select: teams => {
                if (!teams) return [];
                return teams
                    .filter(team => team.type === 'TEAM_OF_USERS')
                    .map(team => {
                        return {
                            value: team.id,
                            label: team.name,
                            original: team,
                        };
                    });
            },
        },
    });
};
