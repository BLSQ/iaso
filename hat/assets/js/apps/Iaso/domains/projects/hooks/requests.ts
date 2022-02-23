import { UseQueryResult, UseMutationResult } from 'react-query';
import { getRequest, postRequest, putRequest } from '../../../libs/Api';
import { useSnackQuery, useSnackMutation } from '../../../libs/apiHooks';

import { PaginatedProjects } from '../types/paginatedProjects';
import { FeatureFlag } from '../types/featureFlag';

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
};

type NewParams = {
    limit: string;
    order: string;
    page: string;
    search?: string;
};

export const useGetProjectsPaginated = (
    params: Params,
): UseQueryResult<PaginatedProjects, Error> => {
    const newParams: NewParams = {
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
