import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DropdownOptions } from 'Iaso/types/utils';
import MESSAGES from '../../messages';

export const useGetProfilesDropdown = (): UseQueryResult<
    DropdownOptions<number>,
    Error
> => {
    return useSnackQuery(
        ['profilesDropdown'],
        () => getRequest('/api/profiles/dropdown/'),
        MESSAGES.projectsError,
    );
};
