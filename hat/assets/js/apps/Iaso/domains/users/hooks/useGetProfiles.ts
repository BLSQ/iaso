import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { Profile } from 'Iaso/utils/usersUtils';
import { makeUrlWithParams } from 'Iaso/libs/utils';

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
              managedUsersOnly: params.managedUsersOnly,
          }
        : {};

    const url = makeUrlWithParams(`/api/profiles/`, {
        ...apiParams,
        managedUsersOnly: apiParams.managedUsersOnly ?? 'true',
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

const getProfile = async (
    profileId?: string,
): Promise<Profile> => {
    return getRequest(`/api/profiles/${profileId}/`);
};

export const useGetProfile = (
    profileId?: string,
): UseQueryResult<Profile, Error> => {
    const queryKey: any[] = ['user', profileId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getProfile(profileId),
    });
};
