import {
    OrgUnitTypeHierarchy,
    OrgUnitTypeHierarchyDropdownValues,
} from './hooks/useGetOrgUnitTypesHierarchy';

/**
 * Convert hierarchical org unit types into flat dropdown options.
 *
 * Data from `useGetOrgUnitTypesHierarchy` is a tree; dropdown inputs need a
 * flat list of `{ value, label, original }` options.
 */
export const flattenOrgUnitTypeHierarchy = (
    items: OrgUnitTypeHierarchy[],
    orgUnitTypeId?: number,
    selectedOrgUnitTypeIds?: number[],
): OrgUnitTypeHierarchyDropdownValues => {
    return items.flatMap(item => {
        if (
            selectedOrgUnitTypeIds?.includes(item.id) &&
            orgUnitTypeId &&
            item.id !== orgUnitTypeId
        ) {
            return [];
        }
        const currentItem: OrgUnitTypeHierarchyDropdownValues[number] = {
            value: item.id,
            label: item.name,
            original: item,
        };
        const children = flattenOrgUnitTypeHierarchy(
            item.sub_unit_types ?? [],
            orgUnitTypeId,
            selectedOrgUnitTypeIds,
        );
        return [currentItem, ...children];
    });
};
