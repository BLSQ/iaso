import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { PaginatedEntities } from '../types/paginatedEntities';
import { Entity } from '../types/entity';

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
        getRequest(`/api/entity/?${searchParams.toString()}`),
    );
};

export const useGet = (): UseQueryResult<Array<Entity>, Error> => {
    // @ts-ignore
    return useSnackQuery(['entities'], () => getRequest('/api/entity/'));
};
