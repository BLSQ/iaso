import { UseMutationResult, UseQueryResult } from 'react-query';
import { useSnackMutation, useSnackQuery } from '../../../../libs/apiHooks';
import {
    deleteRequest,
    getRequest,
    postRequest,
    patchRequest,
} from '../../../../libs/Api';
import MESSAGES from '../../messages';

import { PaginatedEntities } from '../../types/paginatedEntities';
import { Entity } from '../../types/entity';

type Params = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
    entityTypes?: string;
};

type NewParams = {
    limit: string;
    order: string;
    page: string;
    search?: string;
    // eslint-disable-next-line camelcase
    entity_types__ids?: string;
};

export const useGetPaginated = (
    params: Params,
): UseQueryResult<PaginatedEntities, Error> => {
    const newParams: NewParams = {
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };
    if (params.search) {
        newParams.search = params.search;
    }
    if (params.entityTypes) {
        newParams.entity_types__ids = params.entityTypes;
    }

    // @ts-ignore
    const searchParams = new URLSearchParams(newParams);
    // @ts-ignore
    return useSnackQuery(['entities', newParams], () =>
        getRequest(`/api/entities/?${searchParams.toString()}`),
    );
};

export const useGet = (): UseQueryResult<Array<Entity>, Error> => {
    // @ts-ignore
    return useSnackQuery(['entities'], () => getRequest('/api/entities/'));
};

export const useDelete = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body => deleteRequest(`/api/entities/${body.id}/`),
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        invalidateQueryKey: ['entities'],
    });

export const useSave = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body =>
            body.id
                ? patchRequest(`/api/entities/${body.id}/`, body)
                : postRequest('/api/entities/', body),
        invalidateQueryKey: ['entities'],
    });
