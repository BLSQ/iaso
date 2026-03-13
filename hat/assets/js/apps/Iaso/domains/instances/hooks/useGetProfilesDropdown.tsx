import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { DropdownOptions } from 'Iaso/types/utils';
import MESSAGES from '../messages';

export const useGetProfilesDropdown = (
    ids?: string,
): UseQueryResult<DropdownOptions<number>, Error> => {
    return useSnackQuery({
        queryKey: ['profilesDropdown', ids],
        queryFn: () => {
            if (ids === undefined || ids.length < 1) {
                return [];
            }
            return getRequest(
                makeUrlWithParams('/api/profiles/dropdown/', {
                    ids,
                    limit: 100,
                }),
            );
        },
        snackErrorMsg: MESSAGES.error,
        options: {
            select: data => data?.results,
        },
    });
};
