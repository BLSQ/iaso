import { ApiParams, UrlParams } from 'bluesquare-components';
import { UseMutationResult, useQueryClient, UseQueryResult } from 'react-query';
import { getRequest, postRequest, putRequest } from '../../../libs/Api';
import { useSnackMutation, useSnackQuery } from '../../../libs/apiHooks';
import { DropdownOptions } from '../../../types/utils';
import { FeatureFlag } from '../types/featureFlag';
import { PaginatedProjects } from '../types/paginatedProjects';
import { Project } from '../types/project';

type ProjectApi = {
    projects: Array<Project>;
};
const getProjects = (
    canBypassProjectRestrictions = false,
): Promise<ProjectApi> => {
    let url = '/api/projects/';
    if (canBypassProjectRestrictions) {
        url = '/api/projects/?bypass_restrictions=1';
    }
    return getRequest(url);
};

export const useGetProjectsDropdownOptions = (
    asString = true,
    canBypassProjectRestrictions = false,
): UseQueryResult<DropdownOptions<any>[], Error> => {
    const queryClient = useQueryClient();
    const queryKey: any[] = ['projects-dropdown'];
    return useSnackQuery(
        queryKey,
        () => getProjects(canBypassProjectRestrictions),
        undefined,
        {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            retry: false,
            onError: () => {
                queryClient.setQueryData('projects-dropdown', { projects: [] });
            },
            select: data => {
                if (!data) return [];
                return data.projects.map(project => {
                    return {
                        value: asString ? project.id?.toString() : project.id,
                        label: project.name,
                        color: project.color,
                    };
                });
            },
        },
    );
};

export const useGetProjectsPaginated = (
    params: UrlParams,
): UseQueryResult<PaginatedProjects, Error> => {
    const newParams: ApiParams = {
        limit: params.pageSize || '10',
        order: params.order || 'id',
        page: params.page || '1',
    };
    if (params.search) {
        newParams.search = params.search;
    }

    const searchParams = new URLSearchParams(newParams);

    return useSnackQuery(['projects-paginated', newParams], () =>
        getRequest(`/api/projects/?${searchParams.toString()}`),
    );
};

export const useGetFeatureFlags = (): UseQueryResult<
    Array<FeatureFlag>,
    Error
> => {
    return useSnackQuery(
        ['featureflags'],
        () => getRequest('/api/featureflags/except_no_activated_modules/'),
        undefined,
        {
            // using this here to avoid multiple identical calls
            staleTime: 60000,
            select: data => data.featureflags,
        },
    );
};

export const useSave = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body => {
            return body.id
                ? putRequest(`/api/projects/${body.id}/`, body)
                : postRequest('/api/projects/', body);
        },

        invalidateQueryKey: ['projects-paginated', 'projects-dropdown'],
    });
