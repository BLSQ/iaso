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

import MESSAGES from '../../messages';

export const useDelete = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/entitytype/${body.id}/`),
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
        getRequest(`/api/entitytype/?${searchParams.toString()}`),
    );
};

export const useGetTypes = (): UseQueryResult<Array<EntityType>, Error> => {
    // @ts-ignore
    return useSnackQuery(
        ['entitytypes'],
        () => getRequest('/api/entitytype/'),
        undefined,
        {
            // using this here to avoid multiple identical calls
            staleTime: 60000,
        },
    );
};

export const useSave = (): UseMutationResult =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/entitytype/${body.id}/`, body)
                : postRequest('/api/entitytypes/', body),
        undefined,
        undefined,
        ['entitytypes'],
    );
