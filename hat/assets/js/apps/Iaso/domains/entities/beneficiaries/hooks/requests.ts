/* eslint-disable camelcase */
import { UseMutationResult, UseQueryResult } from 'react-query';
import moment from 'moment';

// @ts-ignore
import { apiDateFormat } from 'Iaso/utils/dates.ts';
import { useSnackMutation, useSnackQuery } from '../../../../libs/apiHooks';
import {
    deleteRequest,
    getRequest,
    postRequest,
    patchRequest,
} from '../../../../libs/Api';
import MESSAGES from '../../messages';

import { Beneficiary } from '../types/beneficiary';
import { Pagination } from '../../../../types/table';
import { Instance } from '../../../instances/types/instance';
import { DropdownOptions } from '../../../../types/utils';
import getDisplayName, { Profile } from '../../../../utils/usersUtils';
import { DropdownTeamsOptions, Team } from '../../../teams/types/team';

export interface PaginatedBeneficiaries extends Pagination {
    result: Array<Beneficiary>;
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
};

type ApiParams = {
    limit: string;
    order: string;
    page: string;
    search?: string;
    orgUnitId?: string;
    dateFrom?: string;
    dateTo?: string;
    created_by_team_id?: string;
    created_by_id?: string;
};

type GetAPiParams = {
    url: string;
    apiParams: ApiParams;
};
export const useGetBeneficiariesApiParams = (params: Params): GetAPiParams => {
    const apiParams: ApiParams = {
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    if (params.search) {
        apiParams.search = params.search;
    }

    if (params.location) {
        apiParams.orgUnitId = params.location;
    }

    if (params.dateFrom) {
        apiParams.dateFrom = moment(params.dateFrom, 'DD-MM-YYYY').format(
            apiDateFormat,
        );
    }
    if (params.dateTo) {
        apiParams.dateTo = moment(params.dateTo, 'DD-MM-YYYY').format(
            apiDateFormat,
        );
    }
    if (params.submitterId) {
        apiParams.created_by_id = params.submitterId;
    }
    if (params.submitterTeamId) {
        apiParams.created_by_team_id = params.submitterTeamId;
    }

    // @ts-ignore
    const searchParams = new URLSearchParams(apiParams);
    return {
        url: `/api/entity/?${searchParams.toString()}`,
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

// export const useGetBeneficiaries = (): UseQueryResult<
//     Array<Beneficiary>,
//     Error
// > =>
//     useSnackQuery({
//         queryKey: ['beneficiaries'],
//         queryFn: () => getRequest('/api/entity'),
//     });

export const useDeleteBeneficiary = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body => deleteRequest(`/api/entity/${body.id}/`),
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        invalidateQueryKey: ['beneficiaries'],
    });

export const useSaveBeneficiary = (): UseMutationResult =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/entity/${body.id}/`, body)
                : postRequest('/api/entity/', body),
        undefined,
        undefined,
        ['beneficiaries'],
    );

const getBeneficiary = (entityId: string | undefined): Promise<Beneficiary> => {
    return getRequest(`/api/entity/${entityId}`);
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

const getSubmissions = (id?: number) => {
    return getRequest(`/api/instances/?entityId=${id}`);
};

export const useGetSubmissions = (
    id?: number,
): UseQueryResult<Instance[], Error> => {
    return useSnackQuery({
        queryKey: ['submissionsForEntity', id],
        queryFn: () => getSubmissions(id),
        options: {
            retry: false,
            enabled: Boolean(id),
            select: data => {
                if (!data) return [];
                return data.instances;
            },
        },
    });
};

export const useGetUsersDropDown = (
    team?: Team,
): UseQueryResult<DropdownOptions<number>, Error> => {
    return useSnackQuery(
        ['profiles', team],
        () => getRequest('/api/profiles'),
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
    return getRequest('/api/microplanning/teams') as Promise<Team[]>;
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
    return getRequest(`/api/instances/${submissionId}`);
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
