import { makeUrlWithParams } from '../../../../libs/utils';
import { getRequest } from '../../../../libs/Api';
import getDisplayName from '../../../../utils/usersUtils';
import { ProfileListResponseItem } from 'Iaso/domains/users/types';

export const getUsersDropDown = async (query: string): Promise<any[]> => {
    const url = makeUrlWithParams(`/api/profiles/`, { search: query });
    return getRequest(url).then(data =>
        data.results.map((user: ProfileListResponseItem) => {
            return {
                value: user.user_id,
                label: getDisplayName(user),
            };
        }),
    );
};
