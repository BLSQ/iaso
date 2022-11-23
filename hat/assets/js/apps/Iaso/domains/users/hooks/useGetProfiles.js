import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';

export const useGetProfiles = params => {
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
        if (params.permissions) {
            newParams.permissions = params.permissions;
        }
        if (params.location) {
            newParams.location = params.location;
        }
    }

    const searchParams = new URLSearchParams(newParams);
    return useSnackQuery(['profiles', newParams], () =>
        getRequest(`/api/profiles/?${searchParams.toString()}`),
    );
};
