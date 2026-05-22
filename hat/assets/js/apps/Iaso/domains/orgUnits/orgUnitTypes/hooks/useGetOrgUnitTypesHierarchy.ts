import { QueryKey, UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { DropdownOptionsWithOriginal } from 'Iaso/types/utils';

export type OrgUnitTypeHierarchy = {
    id: number;
    name: string;
    short_name: string;
    depth: number;
    category: string;
    sub_unit_types: OrgUnitTypeHierarchy[];
};
export type OrgUnitTypeHierarchyDropdownValues = DropdownOptionsWithOriginal<
    number,
    OrgUnitTypeHierarchy
>[];

/**
 * Fetch org unit types hierarchy as a tree.
 *
 * For dropdowns, flatten this hierarchy with `flattenOrgUnitTypeHierarchy`.
 */
export const useGetOrgUnitTypesHierarchy = <TSelected = OrgUnitTypeHierarchy>(
    orgUnitTypeId?: number,
    select?: (data: OrgUnitTypeHierarchy) => TSelected,
): UseQueryResult<TSelected, Error> => {
    const queryKey: QueryKey = ['orgUnitTypeHierarchy', orgUnitTypeId, select];
    return useSnackQuery<OrgUnitTypeHierarchy, Error, TSelected>({
        queryKey,
        queryFn: () =>
            getRequest(`/api/v2/orgunittypes/${orgUnitTypeId}/hierarchy/`),
        options: {
            enabled: Boolean(orgUnitTypeId),
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: Infinity,
            retry: false,
            ...(select ? { select } : {}),
        },
    });
};
