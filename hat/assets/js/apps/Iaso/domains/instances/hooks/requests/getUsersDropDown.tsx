import { ProfileListResponseItem } from 'Iaso/domains/users/types';
import { getRequest } from '../../../../libs/Api';
import { makeUrlWithParams } from '../../../../libs/utils';
import getDisplayName from '../../../../utils/usersUtils';

export const getUsersDropDown = async (query: string): Promise<any[]> => {
    const url = makeUrlWithParams(`/api/v2/profiles/`, { search: query });
    return getRequest(url).then(data =>
        data.results.map((user: ProfileListResponseItem) => {
            return {
                value: user.userId,
                label: getDisplayName(user),
            };
        }),
    );
};
