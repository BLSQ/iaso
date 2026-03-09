import { UseQueryResult } from 'react-query';
import { ProfileListResponseItem } from 'Iaso/domains/users/types';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { DropdownOptions } from '../../../../types/utils';
import getDisplayName from '../../../../utils/usersUtils';
import MESSAGES from '../../messages';

export const useGetProfilesDropdown = (): UseQueryResult<
    DropdownOptions<number>,
    Error
> => {
    return useSnackQuery(
        ['profiles'],
        () => getRequest('/api/v2/profiles/'),
        MESSAGES.projectsError,
        {
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
    );
};
