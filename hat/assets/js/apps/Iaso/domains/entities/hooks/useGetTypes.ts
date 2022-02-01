import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

import { PaginatedEntityTypes } from '../types/paginatedEntityTypes';
import { EntityType } from '../types/entityType';

type Params = {
    pageSize: string;
    order: string;
    page: string;
};

export const useGetTypesPaginated = (
    params: Params,
): UseQueryResult<PaginatedEntityTypes | Array<EntityType>, Error> => {
    const newParams = {
        limit: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };

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
