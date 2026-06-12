import { QueryClient } from 'react-query';
import {
    getProfilesDropdownQueryKey,
    ProfilesDropdownParams,
} from 'Iaso/domains/users/utils';
import { getRequest } from 'Iaso/libs/Api';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { DropdownOptions } from 'Iaso/types/utils';

type Props = {
    query: string;
    additionalFilters?: object;
    limit?: number;
    queryClient: QueryClient;
};
export const getUsersDropDown = async ({
    query,
    additionalFilters,
    limit,
    queryClient,
}: Props): Promise<DropdownOptions<number>[]> => {
    const params: ProfilesDropdownParams = {
        ...(limit && { limit: `${limit}` }),
        ...(query && { search: query }),
        ...(additionalFilters ?? {}),
    };

    const data = await queryClient.fetchQuery(
        getProfilesDropdownQueryKey(params),
        () => getRequest(makeUrlWithParams('/api/profiles/dropdown/', params)),
        { staleTime: 1000 * 60 * 5 },
    );

    return limit ? (data?.results ?? []) : data;
};
