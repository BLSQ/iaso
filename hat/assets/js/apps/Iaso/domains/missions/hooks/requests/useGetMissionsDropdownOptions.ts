import { useMemo } from 'react';
import { UseQueryResult } from 'react-query';
import { Mission } from 'Iaso/domains/missions/types';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { DropdownOptionsWithOriginal } from 'Iaso/types/utils';

const DEFAULT_FIELDS = ['id', 'name'];

export type UseGetMissionsDropdownParams = {
    /**
     * Additional fields to fetch beyond id and name.
     * These will be available in the 'original' property of each option.
     * Example: ['description']
     */
    extraFields?: string[];

    /**
     * Query parameters to pass to the API
     * Common params:
     * - mission_type: string - Filter by mission type
     * - name: string - Filter by name
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
 * Unified hook for fetching missions as dropdown options
 *
 * @param options Configuration options for filtering and fetching missions
 * @returns Query result with missions formatted as DropdownOptionsWithOriginal
 *
 * @example
 * // Basic usage - minimal fields
 * const { data: missions } = useGetMissionsDropdownOptions();
 *
 * @example
 * // With extra fields (returns all missions by default)
 * const { data: missions } = useGetMissionsDropdownOptions({
 *   extraFields: ['description'],
 * });
 *
 * @example
 * // Filtered by mission type
 * const { data: missions } = useGetMissionsDropdownOptions({
 *   extraFields: ['description'],
 *   params: { mission_type: "FORM_FILLING" },
 * });
 *
 */

export type MissionsDropdownOptions = DropdownOptionsWithOriginal<
    number,
    Partial<Mission>
>[];

export const useGetMissionsDropdownOptions = (
    options: UseGetMissionsDropdownParams = {},
): UseQueryResult<MissionsDropdownOptions, Error> => {
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

    const queryKey = useMemo(() => ['missions', queryParams], [queryParams]);

    const url = makeUrlWithParams('/api/microplanning/missions/', queryParams);

    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest(url),
        options: {
            enabled,
            staleTime: 1000 * 60 * 15, // 15 minutes
            cacheTime: 1000 * 60 * 5, // 5 minutes
            keepPreviousData: true,
            select: missions => {
                if (!missions) return [];

                return missions.map((mission: Mission) => ({
                    value: mission.id,
                    label: mission.name,
                    original: mission,
                }));
            },
        },
    });
};
