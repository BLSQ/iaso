import { UseQueryResult, UseMutationResult } from 'react-query';
import { useDeleteTableRow } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../../constants/urls';
import {
    getRequest,
    deleteRequest,
    postRequest,
    patchRequest,
} from '../../../../../libs/Api';
import { useSnackQuery, useSnackMutation } from '../../../../../libs/apiHooks';

import { useCurrentUser } from '../../../../../utils/usersUtils';

import MESSAGES from '../../messages';
import { EntityType } from '../../types/entityType';
import { PaginatedEntityTypes } from '../../types/paginatedEntityTypes';

type useDeleteArgs = {
    params: Params;
    count: number;
};

export const useDelete = ({
    params,
    count,
}: useDeleteArgs): UseMutationResult => {
    const onSuccess = useDeleteTableRow({
        count,
        params,
        pageKey: 'page',
        pageSizeKey: 'pageSize',
        invalidateQueries: ['entitytypes', 'entityTypesOptions'],
        baseUrl: baseUrls.entityTypes,
    });
    return useSnackMutation({
        mutationFn: body => deleteRequest(`/api/entitytypes/${body.id}/`),
        snackSuccessMessage: MESSAGES.deleteSuccess,
        snackErrorMsg: MESSAGES.deleteError,
        options: {
            onSuccess,
        },
    });
};

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

    const searchParams = new URLSearchParams(newParams);
    return useSnackQuery(['entitytypes', newParams], () =>
        getRequest(`/api/entitytypes/?${searchParams.toString()}`),
    );
};

export const useGetTypes = (): UseQueryResult<Array<EntityType>, Error> => {
    return useSnackQuery({
        queryKey: ['entitytypes'],
        queryFn: () => getRequest('/api/entitytypes/'),
        options: {
            staleTime: Infinity,
        },
    });
};

export const useGetType = (
    typeId: string,
    enabled = true,
): UseQueryResult<EntityType, Error> => {
    return useSnackQuery({
        queryKey: ['entitytype', typeId],
        queryFn: () => getRequest(`/api/entitytypes/${typeId}/`),
        options: {
            enabled,
        },
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
        invalidateQueryKey: ['entitytypes', 'entityTypesOptions'],
    });
};
