import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { makeUrlWithParams } from '../../../libs/utils.tsx';


export const useGetProfilesApiParams = params => {

    const apiParams = params
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
              projects: params.projectsIds,
              userRoles: params.userRoles,
              teams: params.teamsIds,
          }
        : {};

    const url = makeUrlWithParams(`/api/profiles/`, {
        ...apiParams,
        managedUsersOnly: 'true',
    });

    return {
        url,
        apiParams,
    };

};

export const useGetProfiles = params => {
    const { url, apiParams } = useGetProfilesApiParams(params);
    return useSnackQuery(['profiles', apiParams], () => getRequest(url));
};
