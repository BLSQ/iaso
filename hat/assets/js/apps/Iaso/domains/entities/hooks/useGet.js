import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGet = params => {
    let newParams = {};
    if (params) {
        newParams = {
            limit: params.pageSize,
            order: params.order,
            page: params.page,
        };
        if (params.search) {
            newParams.search = params.search;
        }
        if (params.entityTypes) {
            newParams.entity_types__ids = params.entityTypes;
        }
    }

    const searchParams = new URLSearchParams(newParams);
    return useSnackQuery(['entities', newParams], () =>
        getRequest(`/api/entity/?${searchParams.toString()}`),
    );
};
