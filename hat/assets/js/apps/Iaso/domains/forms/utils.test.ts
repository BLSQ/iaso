import { describe, expect, it } from 'vitest';
import { OrgUnitTypeHierarchyDropdownValues } from '../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { FormsDropdownOptions } from './hooks/useGetFormsDropdownOptions';
import { filterOrgUnitTypesByForms } from './utils';

const createOrgUnitType = (
    id: number,
    name: string,
): OrgUnitTypeHierarchyDropdownValues[number] => ({
    value: id,
    label: name,
    original: {
        id,
        name,
        short_name: name,
        depth: 1,
        category: 'test',
        sub_unit_types: [],
    },
});

describe('filterOrgUnitTypesByForms', () => {
    const orgUnitTypes: OrgUnitTypeHierarchyDropdownValues = [
        createOrgUnitType(1, 'Region'),
        createOrgUnitType(2, 'District'),
        createOrgUnitType(3, 'Facility'),
    ];

    it('returns all org unit types when no form is selected', () => {
        const forms: FormsDropdownOptions = [
            {
                value: 11,
                label: 'Form A',
                original: {
                    id: 11,
                    org_unit_type_ids: [1, 2],
                },
            },
        ];

        expect(filterOrgUnitTypesByForms(orgUnitTypes, forms, [])).toEqual(
            orgUnitTypes,
        );
    });

    it('returns all org unit types when selected forms have no org_unit_type_ids', () => {
        const forms: FormsDropdownOptions = [
            {
                value: 11,
                label: 'Form A',
                original: {
                    id: 11,
                },
            },
        ];

        expect(filterOrgUnitTypesByForms(orgUnitTypes, forms, [11])).toEqual(
            orgUnitTypes,
        );
    });

    it('returns only compatible org unit types for selected forms', () => {
        const forms: FormsDropdownOptions = [
            {
                value: 11,
                label: 'Form A',
                original: {
                    id: 11,
                    org_unit_type_ids: [1, 3],
                },
            },
            {
                value: 12,
                label: 'Form B',
                original: {
                    id: 12,
                    org_unit_type_ids: [2],
                },
            },
        ];

        expect(filterOrgUnitTypesByForms(orgUnitTypes, forms, [11])).toEqual([
            createOrgUnitType(1, 'Region'),
            createOrgUnitType(3, 'Facility'),
        ]);
    });
});
