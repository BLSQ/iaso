import { getRequest } from 'Iaso/libs/Api';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { DropdownOptions } from 'Iaso/types/utils';

export const getUsersDropDown = async (
    query: string,
): Promise<DropdownOptions<number>[]> => {
    const url = makeUrlWithParams(`/api/profiles/dropdown/`, {
        search: query,
        limit: 100,
    });
    return getRequest(url).then(data => data.results);
};
