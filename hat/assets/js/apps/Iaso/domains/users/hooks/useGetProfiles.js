import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetProfiles = params => {
    const nemParams = {
        limit: params.pageSize,
        order: params.order,
        page: params.page,
    };
    if (params.search) {
        nemParams.search = params.search;
    }

    const searchParams = new URLSearchParams(nemParams);
    return useSnackQuery(['profiles', nemParams], () =>
        getRequest(`/api/profiles/?${searchParams.toString()}`),
    );
};
