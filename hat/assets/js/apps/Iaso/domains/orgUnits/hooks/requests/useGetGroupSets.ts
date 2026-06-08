import { UseQueryResult } from 'react-query';
// @ts-ignore
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
// @ts-ignore
import { makeUrlWithParams } from '../../../../libs/utils';
import { DropdownOptions } from '../../../../types/utils';

import { staleTime } from '../../config';
import MESSAGES from '../../messages';

export const useGetGroupSetsDropdown = (
    params?: Record<string, string>,
): UseQueryResult<DropdownOptions<string>[], Error> => {
    const url = params
        ? makeUrlWithParams('/api/group_sets/dropdown/', params)
        : '/api/group_sets/dropdown/';
    return useSnackQuery({
        queryKey: ['groupSets', url],
        queryFn: () => getRequest(url),
        snackErrorMsg: MESSAGES.fetchGroupSetsError,
        options: {
            staleTime,
            select: data => {
                if (!data) return [];
                return data.map(groupSet => {
                    return {
                        value: groupSet.id,
                        label: groupSet.label,
                        original: groupSet,
                    };
                });
            },
        },
    });
};
