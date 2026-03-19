import { UseQueryResult } from 'react-query';
import {
    ProfileListResponseItem,
    ProfileRetrieveResponseItem,
} from 'Iaso/domains/users/types';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { Pagination } from 'Iaso/types/general';
import { Profile } from 'Iaso/utils/usersUtils';

export const useGetProfilesApiParams = params => {
    const apiParams = params
        ? {
              limit: params.pageSize,
              order: params.order,
              page: params.page,
              search: params.search,
              org_unit_types: params.orgUnitTypes,
              location: params.location,
              permissions: params.permissions,
              ouParent: params.ouParent,
              ouChildren: params.ouChildren,
              projects: params.projectsIds,
              user_roles: params.userRoles,
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

type ListResponse = Pagination & {
    results: ProfileListResponseItem[];
};

export const useGetProfiles = (params): UseQueryResult<ListResponse, Error> => {
    const { url, apiParams } = useGetProfilesApiParams(params);
    return useSnackQuery(['profiles', apiParams], () => getRequest(url));
};

const getProfile = async (profileId?: string): Promise<Profile> => {
    return getRequest(`/api/profiles/${profileId}/`);
};

export const useGetProfile = (
    profileId?: string,
): UseQueryResult<ProfileRetrieveResponseItem, Error> => {
    const queryKey: any[] = ['userDetail', profileId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getProfile(profileId),
    });
};
