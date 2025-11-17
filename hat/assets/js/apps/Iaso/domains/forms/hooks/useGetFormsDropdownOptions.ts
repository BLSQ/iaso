import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../libs/utils';
import { DropdownOptionsWithOriginal } from '../../../types/utils';
import { Form } from '../types/forms';

const DEFAULT_FIELDS = ['id', 'name'];

export type UseGetFormsDropdownParams = {
    /**
     * Additional fields to fetch beyond id and name.
     * These will be available in the 'original' property of each option.
     * Example: ['period_type', 'label_keys', 'org_unit_type_ids']
     */
    extraFields?: string[];

    /**
     * Query parameters to pass to the API
     * Common params:
     * - orgUnitTypeIds: number | number[] | string - Filter by org unit type
     * - projectId: number - Filter by project
     * - order: string - Sort order (default: 'name')
     * - any other API-supported params
     */
    params?: Record<string, any>;

    /**
     * Enable/disable the query (default: true)
     */
    enabled?: boolean;
};

/**
 * Unified hook for fetching forms as dropdown options
 *
 * @param options Configuration options for filtering and fetching forms
 * @returns Query result with forms formatted as DropdownOptionsWithOriginal
 *
 * @example
 * // Basic usage - minimal fields
 * const { data: forms } = useGetFormsDropdownOptions();
 *
 * @example
 * // With extra fields (returns all forms by default)
 * const { data: forms } = useGetFormsDropdownOptions({
 *   extraFields: ['period_type', 'label_keys'],
 * });
 *
 * @example
 * // Filtered by org unit type
 * const { data: forms } = useGetFormsDropdownOptions({
 *   extraFields: ['org_unit_type_ids'],
 *   params: { orgUnitTypeIds: 123 },
 * });
 *
 * @example
 * // Filtered by project
 * const { data: forms } = useGetFormsDropdownOptions({
 *   params: { projectId: 456 },
 * });
 */
export const useGetFormsDropdownOptions = (
    options: UseGetFormsDropdownParams = {},
): UseQueryResult<
    DropdownOptionsWithOriginal<number, Partial<Form>>[],
    Error
> => {
    const { extraFields = [], params = {}, enabled = true } = options;
    const allFields = useMemo(
        () => [...DEFAULT_FIELDS, ...extraFields],
        [extraFields],
    );
    const queryParams = useMemo(() => {
        return {
            fields: allFields.join(','),
            order: 'name', // Default order
            ...params, // User params override defaults
        };
    }, [allFields, params]);

    const queryKey = useMemo(
        () => ['formsdropdown', queryParams],
        [queryParams],
    );

    const url = makeUrlWithParams('/api/forms/', queryParams);

    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(url),
        options: {
            enabled,
            staleTime: 1000 * 60 * 15, // 15 minutes
            cacheTime: 1000 * 60 * 5, // 5 minutes
            keepPreviousData: true,
            select: data => {
                if (!data?.forms) return [];

                const forms = data.forms;

                return forms.map((form: Form) => ({
                    value: form.id,
                    label: form.name,
                    original: form,
                }));
            },
        },
    });
};
