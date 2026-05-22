import { OrgUnitTypeHierarchyDropdownValues } from '../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { FormsDropdownOptions } from './hooks/useGetFormsDropdownOptions';

/**
 * Filter org unit types by forms
 *
 * @param orgunitTypes Available org unit types from hierarchy dropdown.
 * @param forms Optional forms dropdown options. Form originals can include
 * `org_unit_type_ids` used to determine compatible org unit types.
 * @param selectedFormsIds Optional list of selected form ids.
 * @returns The original org unit types list when no matching constraints exist,
 * otherwise the subset compatible with selected forms.
 */
export const filterOrgUnitTypesByForms = (
    orgunitTypes: OrgUnitTypeHierarchyDropdownValues,
    forms?: FormsDropdownOptions,
    selectedFormsIds?: number[],
) => {
    const possibleTypes =
        forms
            ?.filter(form => selectedFormsIds?.includes(form.value))
            .flatMap(form => form.original?.org_unit_type_ids || []) ?? [];
    if (possibleTypes.length === 0) {
        return orgunitTypes;
    }
    return orgunitTypes.filter(type => possibleTypes?.includes(type.value));
};
