import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { DropdownOptions } from '../../../../types/utils';
import MESSAGES from '../../messages';
import getDisplayName, { Profile } from '../../../../utils/usersUtils';

export const useGetProfilesDropdown = (): UseQueryResult<
    DropdownOptions<number>,
    Error
> => {
    return useSnackQuery(
        ['profiles'],
        () => getRequest('/api/profiles/'),
        MESSAGES.projectsError,
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
