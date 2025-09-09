import { UseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../../../libs/apiHooks';
import { getRequest } from '../../../../../libs/Api';

import { Form } from '../../../../forms/types/forms';
import { DropdownOptions } from '../../../../../types/utils';
import { apiUrlForms } from '../../constants';

export const useGetFormDropdownOptions = (
    orgUnitTypeId: number,
): UseQueryResult<DropdownOptions<number>[], Error> => {
    const url = `${apiUrlForms}?orgUnitTypeIds=${orgUnitTypeId}`;
    return useSnackQuery({
        queryKey: ['useGetFormDropdownOptions', url],
        queryFn: () => getRequest(url),
        options: {
            enabled: Boolean(orgUnitTypeId),
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            retry: false,
            select: data => {
                return (
                    data?.forms?.map((form: Form) => {
                        return {
                            value: form.id,
                            label: form.name,
                        };
                    }) ?? []
                );
            },
        },
    });
};
