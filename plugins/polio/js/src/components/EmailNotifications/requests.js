import { iasoGetRequest } from '../../../../../../hat/assets/js/apps/Iaso/utils/requests';

export const getCountryUsersGroup = async () => {
    const data = await iasoGetRequest({
        requestParams: { url: '/api/polio/countryusersgroup/' },
        disableSuccessSnackBar: true,
    });
    return {
        country_users_group: data.country_users_group,
        pages: 0,
        count: 0,
    };
};

export const getCountryConfigDetails = async id => {
    return iasoGetRequest({
        requestParams: { url: `/api/polio/countryusersgroup/${id}` },
        disableSuccessSnackBar: true,
    });
};
