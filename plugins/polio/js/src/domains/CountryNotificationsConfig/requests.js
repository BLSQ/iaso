import { getRequest, putRequest } from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetCountryUsersGroup = params => {
    const searchParams = new URLSearchParams({
        limit: params.pageSize,
        order: params.order,
        page: params.page,
    });
    return useSnackQuery(
        ['countryusersgroup', params],
        async () =>
            getRequest(
                `/api/polio/countryusersgroup/?${searchParams.toString()}`,
            ),
        undefined,
        {
            select: data => ({
                country_users_group: data.country_users_group,
                pages: data.pages,
                count: data.count,
            }),
        },
    );
};

export const usePutCountryMutation = () =>
    useSnackMutation(
        async ({ id, users, language, teams }) =>
            putRequest(`/api/polio/countryusersgroup/${id}/`, {
                users,
                language,
                teams,
            }),
        undefined,
        undefined,
        ['countryusersgroup'],
    );

export const useGetProfiles = () =>
    useSnackQuery(['polio', 'profiles'], async () =>
        getRequest('/api/profiles'),
    );

export const useCountryUsersGroup = countryId => {
    return useSnackQuery(
        ['countryusersgroup'],
        async () => getRequest(`/api/polio/countryusersgroup/`),
        undefined,
        {
            select: data =>
                data.country_users_group.filter(
                    cug => cug.country === countryId,
                )[0],
            enabled: Boolean(countryId),
        },
    );
};
