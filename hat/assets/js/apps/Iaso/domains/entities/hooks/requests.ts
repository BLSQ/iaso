/* eslint-disable camelcase */
import { UseMutationResult, UseQueryResult } from 'react-query';
import moment from 'moment';

// @ts-ignore
import { apiDateFormat } from 'Iaso/utils/dates.ts';
import { Pagination, UrlParams } from 'bluesquare-components';
import { useSnackMutation, useSnackQuery } from '../../../libs/apiHooks';
import {
    deleteRequest,
    getRequest,
    postRequest,
    patchRequest,
} from '../../../libs/Api';
import MESSAGES from '../messages';

import { makeUrlWithParams } from '../../../libs/utils';

import { Beneficiary } from '../types/beneficiary';
import { Instance, PaginatedInstances } from '../../instances/types/instance';
import { DropdownOptions } from '../../../types/utils';
import getDisplayName, { Profile } from '../../../utils/usersUtils';
import { DropdownTeamsOptions, Team } from '../../teams/types/team';
import { ExtraColumn } from '../types/fields';

export interface PaginatedBeneficiaries extends Pagination {
    result: Array<Beneficiary>;
    columns: Array<ExtraColumn>;
}

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
    submitterId?: string;
    submitterTeamId?: string;
    entityTypeIds?: string;
};

type ApiParams = {
    limit: string;
    order_columns: string;
    page: string;
    search?: string;
    orgUnitId?: string;
    dateFrom?: string;
    dateTo?: string;
    created_by_team_id?: string;
    created_by_id?: string;
    entity_type_ids?: string;
};

type GetAPiParams = {
    url: string;
    apiParams: ApiParams;
};
export const useGetBeneficiariesApiParams = (params: Params): GetAPiParams => {
    const apiParams: ApiParams = {
        limit: params.pageSize || '20',
        order_columns: params.order || 'id',
        page: params.page || '1',
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
    };
    const url = makeUrlWithParams('/api/entities/', apiParams);
    return {
        url,
        apiParams,
    };
};

export const useGetBeneficiariesPaginated = (
    params: Params,
): UseQueryResult<PaginatedBeneficiaries, Error> => {
    const { url, apiParams } = useGetBeneficiariesApiParams(params);
    // @ts-ignore
    return useSnackQuery({
        queryKey: ['beneficiaries', apiParams],
        queryFn: () => getRequest(url),
        options: {
            staleTime: 60000,
        },
    });
};

export const useGetBeneficiaryTypesDropdown = (): UseQueryResult<
    Array<DropdownOptions<number>>,
    Error
> =>
    useSnackQuery({
        queryKey: ['beneficiaryTypes'],
        queryFn: () => getRequest('/api/entitytypes/'),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data =>
                data?.map(
                    type =>
                        ({
                            label: type.name,
                            value: type.id,
                            original: type,
                        } || []),
                ),
        },
    });

export const useDeleteBeneficiary = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body => deleteRequest(`/api/entities/${body.id}/`),
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        invalidateQueryKey: ['beneficiaries'],
    });

export const useSaveBeneficiary = (): UseMutationResult =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/entities/${body.id}/`, body)
                : postRequest('/api/entities/', body),
        undefined,
        undefined,
        ['beneficiaries'],
    );

const getBeneficiary = (entityId: string | undefined): Promise<Beneficiary> => {
    return getRequest(`/api/entities/${entityId}/`);
};
export const useGetBeneficiary = (
    entityId: string | undefined,
): UseQueryResult<Beneficiary, Error> => {
    const queryKey: any[] = ['beneficiary', entityId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getBeneficiary(entityId),
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
    params: Partial<UrlParams>,
    entityId?: number,
): UseQueryResult<PaginatedInstances, Error> => {
    return useSnackQuery({
        queryKey: ['submissionsForEntity', entityId, params],
        queryFn: () => getSubmissions(params, entityId),
        options: {
            retry: false,
            enabled: Boolean(entityId),
        },
    });
};

export const useGetUsersDropDown = (
    team?: Team,
): UseQueryResult<DropdownOptions<number>, Error> => {
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

const getVisitSubmission = (submissionId: string): Promise<any> => {
    return getRequest(`/api/instances/${submissionId}/`);
};

export const useGetVisitSubmission = (
    submissionId: string,
): UseQueryResult<Instance, Error> => {
    return useSnackQuery({
        queryKey: ['beneficiaryVisit', submissionId],
        queryFn: () => getVisitSubmission(submissionId),
        options: {
            select: data => {
                if (!data) return { file_content: [] };
                return data;
            },
            // Prevent from refteching when navigating back and forth
            staleTime: Infinity,
        },
    });
};
