import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

import { PaginatedEntityTypes } from '../types/paginatedEntityTypes';
import { EntityType } from '../types/entityType';

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
    return useSnackQuery(['entitytypes'], () => getRequest('/api/entitytype/'));
};
