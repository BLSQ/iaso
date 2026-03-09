import { UseQueryResult } from 'react-query';
import { ProfileListResponseItem } from 'Iaso/domains/users/types';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { DropdownOptions } from 'Iaso/types/utils';
import getDisplayName from '../../../utils/usersUtils';
import MESSAGES from '../messages';

export const useGetProfilesDropdown = (
    ids?: string,
): UseQueryResult<DropdownOptions<number>, Error> => {
    return useSnackQuery({
        queryKey: ['profiles', ids],
        queryFn: () => {
            if (ids === undefined || ids.length < 1) {
                return [];
            }
            return getRequest(makeUrlWithParams('/api/v2/profiles/', { ids }));
        },
        snackErrorMsg: MESSAGES.error,
        options: {
            select: data => {
                return (
                    data?.results?.map((profile: ProfileListResponseItem) => {
                        return {
                            value: profile.userId,
                            label: getDisplayName(profile),
                        };
                    }) ?? []
                );
            },
        },
    });
};
