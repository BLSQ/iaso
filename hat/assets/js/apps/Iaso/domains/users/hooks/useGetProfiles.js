import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { makeUrlWithParams } from '../../../libs/utils.tsx';

export const useGetProfiles = params => {
    const newParams = params
        ? {
              limit: params.pageSize,
              order: params.order,
              page: params.page,
              search: params.search,
              orgUnitTypes: params.orgUnitTypes,
              location: params.location,
              permissions: params.permissions,
              ouParent: params.ouParent,
              ouChildren: params.ouChildren,
              userRoles: params.userRoles,
          }
        : {};

    const url = makeUrlWithParams(`/api/profiles/`, newParams);

    return useSnackQuery(['profiles', newParams], () => getRequest(url));
};
