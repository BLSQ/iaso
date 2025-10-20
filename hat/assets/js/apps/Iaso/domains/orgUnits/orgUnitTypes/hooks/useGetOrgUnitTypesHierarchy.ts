import { UseQueryResult } from 'react-query';
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

export const flattenHierarchy = (
    items: any[],
    orgUnitTypeId?: number,
    selectedOrgUnitTypeIds?: number[],
): any[] => {
    return items.flatMap(item => {
        if (
            selectedOrgUnitTypeIds?.includes(item.id) &&
            orgUnitTypeId &&
            item.id !== orgUnitTypeId
        ) {
            return [];
        }
        const currentItem = {
            value: item.id,
            label: item.name,
            original: item,
        };
        const children = flattenHierarchy(
            item.sub_unit_types ?? [],
            orgUnitTypeId,
            selectedOrgUnitTypeIds,
        );
        return [currentItem, ...children];
    });
};

export const useGetOrgUnitTypesHierarchy = (
    orgUnitTypeId: number,
): UseQueryResult<OrgUnitTypeHierarchy, Error> => {
    const queryKey: any[] = ['orgUnitTypeHierarchy', orgUnitTypeId];
    return useSnackQuery({
        queryKey,
        queryFn: () =>
            getRequest(`/api/v2/orgunittypes/${orgUnitTypeId}/hierarchy/`),
        options: {
            enabled: Boolean(orgUnitTypeId),
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
            retry: false,
        },
    });
};
