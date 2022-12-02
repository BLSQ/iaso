import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { makeUrlWithParams } from '../../../libs/utils.tsx';

export const useGetProfiles = params => {
    const url = makeUrlWithParams(`/api/profiles/`, params);
    let newParams = {};
    if (params) {
        newParams = {
            limit: params.pageSize,
            order: params.order,
            page: params.page,
        };
        newParams.orgUnitTypes = params.orgUnitTypes;
        newParams.search = params.search;
        newParams.location = params.location;
        newParams.permissions = params.permissions;
    }

    return useSnackQuery(['profiles', newParams], () => getRequest(url));
};
