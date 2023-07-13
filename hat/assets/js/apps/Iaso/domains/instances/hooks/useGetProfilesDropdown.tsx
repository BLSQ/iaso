import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../libs/apiHooks';
import { DropdownOptions } from '../../../types/utils';
import MESSAGES from '../messages';
import getDisplayName, { Profile } from '../../../utils/usersUtils';
import { getRequest } from '../../../libs/Api';
import { makeUrlWithParams } from '../../../libs/utils';

export const useGetProfilesDropdown = (
    ids: string,
): UseQueryResult<DropdownOptions<number>, Error> => {
    return useSnackQuery(
        ['profiles', ids],
        () => {
            if (ids.length < 1) {
                return Promise.any([]);
            }
            return getRequest(makeUrlWithParams('/api/profiles', { ids }))
        },
        MESSAGES.error,
        {
            select: data => {
                return (
                    data?.profiles?.map((profile: Profile) => {
                        return {
                            value: profile.user_id,
                            label: getDisplayName(profile),
                        };
                    }) ?? []
                );
            },
        },
    );
};
