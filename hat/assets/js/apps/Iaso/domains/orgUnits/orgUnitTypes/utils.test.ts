import { describe, expect, it } from 'vitest';
import { OrgUnitTypeHierarchy } from './hooks/useGetOrgUnitTypesHierarchy';
import { flattenOrgUnitTypeHierarchy } from './utils';

const hierarchy: OrgUnitTypeHierarchy[] = [
    {
        id: 1,
        name: 'Country',
        short_name: 'CTY',
        depth: 0,
        category: 'root',
        sub_unit_types: [
            {
                id: 2,
                name: 'Region',
                short_name: 'REG',
                depth: 1,
                category: 'admin',
                sub_unit_types: [
                    {
                        id: 3,
                        name: 'District',
                        short_name: 'DST',
                        depth: 2,
                        category: 'admin',
                        sub_unit_types: [],
                    },
                ],
            },
        ],
    },
    {
        id: 4,
        name: 'Facility',
        short_name: 'FAC',
        depth: 0,
        category: 'service',
        sub_unit_types: [],
    },
];

describe('flattenOrgUnitTypeHierarchy', () => {
    it('flattens hierarchy into dropdown options', () => {
        const result = flattenOrgUnitTypeHierarchy(hierarchy);

        expect(result.map(item => item.value)).toEqual([1, 2, 3, 4]);
        expect(result.map(item => item.label)).toEqual([
            'Country',
            'Region',
            'District',
            'Facility',
        ]);
    });

    it('filters out selected org unit types different from orgUnitTypeId', () => {
        const result = flattenOrgUnitTypeHierarchy(hierarchy, 2, [2, 4]);

        expect(result.map(item => item.value)).toEqual([1, 2, 3]);
    });

    it('does not filter when orgUnitTypeId is not provided', () => {
        const result = flattenOrgUnitTypeHierarchy(hierarchy, undefined, [2, 4]);

        expect(result.map(item => item.value)).toEqual([1, 2, 3, 4]);
    });
});
