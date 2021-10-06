import {
    getRequest,
    putRequest,
} from '../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import {
    useSnackMutation,
    useSnackQuery,
} from '../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

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
        async ({ id, users, language }) =>
            putRequest(`/api/polio/countryusersgroup/${id}/`, {
                users,
                language,
            }),
        undefined,
        undefined,
        ['countryusersgroup'],
    );

export const useGetProfiles = () =>
    useSnackQuery(['polio', 'profiles'], async () =>
        getRequest('/api/profiles'),
    );
