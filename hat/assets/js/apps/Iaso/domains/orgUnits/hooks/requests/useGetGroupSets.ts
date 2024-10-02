import { UseQueryResult } from 'react-query';
// @ts-ignore
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
import { DropdownOptions } from '../../../../types/utils';

import { staleTime } from '../../config';
import MESSAGES from '../../messages';

export const useGetGroupSetsDropdown = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
    return useSnackQuery({
        queryKey: ['groupSets'],
        queryFn: () => getRequest(`/api/group_sets/dropdown/`),
        snackErrorMsg: MESSAGES.fetchGroupSetsError,
        options: {
            staleTime,
            select: data => {
                if (!data) return [];
                return data.map(groupSet => {
                    return {
                        value: groupSet.id,
                        label: groupSet.name,
                        original: groupSet,
                    };
                });
            },
        },
    });
};
