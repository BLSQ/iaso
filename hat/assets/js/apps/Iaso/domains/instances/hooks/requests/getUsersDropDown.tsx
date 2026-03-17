import { QueryClient } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { DropdownOptions } from 'Iaso/types/utils';

type Props = {
    query: string;
    limit?: number;
    queryClient: QueryClient;
};
export const getUsersDropDown = async ({
    query,
    limit,
    queryClient,
}: Props): Promise<DropdownOptions<number>[]> => {
    const params = {
        ...(limit && { limit }),
        ...(query && { search: query }),
    };

    const data = await queryClient.fetchQuery(['profiles', params ?? {}], () =>
        getRequest(makeUrlWithParams('/api/profiles/dropdown/', params)),
    );

    return limit ? (data?.results ?? []) : data;
};
