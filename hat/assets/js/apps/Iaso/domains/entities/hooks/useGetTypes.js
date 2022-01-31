import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetTypes = params => {
    let newParams = {};
    if (params) {
        newParams = {
            limit: params.pageSize,
            order: params.order,
            page: params.page,
        };
    }

    const searchParams = new URLSearchParams(newParams);
    return useSnackQuery(['entitytypes', newParams], () =>
        getRequest(`/api/entitytype/?${searchParams.toString()}`),
    );
};
