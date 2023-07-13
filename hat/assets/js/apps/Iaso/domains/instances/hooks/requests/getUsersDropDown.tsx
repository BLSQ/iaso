import { makeUrlWithParams } from '../../../../libs/utils';
import { getRequest } from '../../../../libs/Api';
import getDisplayName from '../../../../utils/usersUtils';

export const getUsersDropDown = async (query: string): Promise<any[]> => {
    const url = makeUrlWithParams(`/api/profiles/`, { search: query });
    return getRequest(url).then(data =>
        data.profiles.map(user => {
            return {
                value: user.id,
                label: getDisplayName(user),
            };
        }),
    );
};
