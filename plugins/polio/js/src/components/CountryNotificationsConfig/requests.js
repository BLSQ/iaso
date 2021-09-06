import {
    iasoGetRequest,
    iasoPutRequest,
} from '../../../../../../hat/assets/js/apps/Iaso/utils/requests';

export const getCountryUsersGroup = async params => {
    const url = `/api/polio/countryusersgroup/?page=${params.page ?? 1}&limit=${
        params.pageSize ?? 10
    }&order=${params.order ?? 'country__name'}`;
    const data = await iasoGetRequest({
        requestParams: { url },
        disableSuccessSnackBar: true,
    });
    return {
        country_users_group: data.country_users_group,
        pages: data.pages,
        count: data.count,
    };
};

export const getAllUsers = async () => {
    return iasoGetRequest({
        requestParams: { url: '/api/profiles' },
        disableSuccessSnackBar: true,
    });
};

export const getCountryConfigDetails = async id => {
    return iasoGetRequest({
        requestParams: { url: `/api/polio/countryusersgroup/${id}` },
        disableSuccessSnackBar: true,
    });
};

export const putCountryConfigDetails = async ({ id, users, language }) => {
    return iasoPutRequest({
        requestParams: {
            url: `/api/polio/countryusersgroup/${id}/`,
            body: { users, language },
        },
    });
};
