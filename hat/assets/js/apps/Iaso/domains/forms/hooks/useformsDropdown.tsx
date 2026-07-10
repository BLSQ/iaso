import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../libs/utils';
import { FormDropdown } from '../types/forms';

export type UseGetFormsDropdownParams = {
    params?: Record<string, any>;
    enabled?: boolean;
};

export const useFormsDropdown = (
    options: UseGetFormsDropdownParams = {},
): UseQueryResult<FormDropdown[], Error> => {
    const { params = {}, enabled = true } = options;

    const queryParams = useMemo(
        () => ({
            order: 'name',
            ...params,
        }),
        [params],
    );

    const queryKey = useMemo(
        () => ['forms', 'dropdown', queryParams],
        [queryParams],
    );

    const url = makeUrlWithParams('/api/forms/dropdown/', queryParams);

    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(url),
        options: {
            enabled,
            staleTime: 1000 * 60 * 15,
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select: (data: FormDropdown[]): FormDropdown[] => data ?? [],
        },
    });
};
