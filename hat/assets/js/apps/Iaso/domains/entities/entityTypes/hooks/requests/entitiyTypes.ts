import { UseQueryResult, UseMutationResult } from 'react-query';
import {
    getRequest,
    deleteRequest,
    postRequest,
    patchRequest,
} from '../../../../../libs/Api';
import { useSnackQuery, useSnackMutation } from '../../../../../libs/apiHooks';

import { PaginatedEntityTypes } from '../../types/paginatedEntityTypes';
import { EntityType } from '../../types/entityType';

import { useCurrentUser } from '../../../../../utils/usersUtils';

import MESSAGES from '../../messages';

export const useDelete = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/entitytypes/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['entitytypes'],
    );

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

export const useGetTypesPaginated = (
    params: Params,
): UseQueryResult<PaginatedEntityTypes, Error> => {
    const newParams: NewParams = {
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    if (params.search) {
        newParams.search = params.search;
    }

    // @ts-ignore
    const searchParams = new URLSearchParams(newParams);
    // @ts-ignore
    return useSnackQuery(['entitytypes', newParams], () =>
        getRequest(`/api/entitytypes/?${searchParams.toString()}`),
    );
};

export const useGetTypes = (): UseQueryResult<Array<EntityType>, Error> => {
    // @ts-ignore
    return useSnackQuery({
        queryKey: ['entitytypes'],
        queryFn: () => getRequest('/api/entitytypes/'),
        options: {
            staleTime: 60000,
        },
    });
};

export const useGetType = (
    typeId: string,
): UseQueryResult<EntityType, Error> => {
    // @ts-ignore
    return useSnackQuery({
        queryKey: ['entitytype', typeId],
        queryFn: () => getRequest(`/api/entitytypes/${typeId}`),
    });
};

export const useSave = (): UseMutationResult => {
    const { account } = useCurrentUser();
    return useSnackMutation({
        mutationFn: body => {
            return body.id
                ? patchRequest(`/api/entitytypes/${body.id}/`, body)
                : postRequest('/api/entitytypes/', {
                    ...body,
                    account: account.id,
                });
        },
        invalidateQueryKey: ['entitytypes'],
    });
};
