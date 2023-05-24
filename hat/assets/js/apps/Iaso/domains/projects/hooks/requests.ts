import { UseQueryResult, UseMutationResult } from 'react-query';
import { getRequest, postRequest, putRequest } from '../../../libs/Api';
import { useSnackQuery, useSnackMutation } from '../../../libs/apiHooks';

import { PaginatedProjects } from '../types/paginatedProjects';
import { Project } from '../types/project';
import { FeatureFlag } from '../types/featureFlag';
import { DropdownOptions } from '../../../types/utils';
import { UrlParams, ApiParams } from '../../../types/table';

type ProjectApi = {
    projects: Array<Project>;
};
const getProjects = (): Promise<ProjectApi> => {
    return getRequest('/api/projects/');
};

export const useGetProjectsDropdownOptions = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
    const queryKey: any[] = ['projects-dropdown'];
    return useSnackQuery(queryKey, () => getProjects(), undefined, {
        select: data => {
            if (!data) return [];
            return data.projects.map(project => {
                return {
                    value: project.id.toString(),
                    label: project.name,
                };
            });
        },
    });
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

    // @ts-ignore
    const searchParams = new URLSearchParams(newParams);
    // @ts-ignore
    return useSnackQuery(['projects-paginated', newParams], () =>
        getRequest(`/api/projects/?${searchParams.toString()}`),
    );
};

export const useGetFeatureFlags = (): UseQueryResult<
    Array<FeatureFlag>,
    Error
> => {
    // @ts-ignore
    return useSnackQuery(
        ['featureflags'],
        () => getRequest('/api/featureflags/'),
        undefined,
        {
            // using this here to avoid multiple identical calls
            staleTime: 60000,
            select: data => data.featureflags,
        },
    );
};

export const useSave = (): UseMutationResult =>
    useSnackMutation(
        body =>
            body.id
                ? putRequest(`/api/apps/${body.old_app_id}/`, body)
                : postRequest('/api/apps/', body),
        undefined,
        undefined,
        ['projects-paginated'],
    );
