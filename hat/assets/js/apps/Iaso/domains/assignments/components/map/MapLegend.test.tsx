import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrgUnitTypeHierarchyDropdownValue } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { MapLegend } from './MapLegend';

const orgUnitTypeA: OrgUnitTypeHierarchyDropdownValue = {
    value: 1,
    label: 'Area',
    original: {
        id: 1,
        name: 'Area',
        short_name: 'Area',
        depth: 1,
        category: 'admin',
        sub_unit_types: [],
    },
};
const orgUnitTypeB: OrgUnitTypeHierarchyDropdownValue = {
    value: 2,
    label: 'Facility',
    original: {
        id: 2,
        name: 'Facility',
        short_name: 'Facility',
        depth: 1,
        category: 'service',
        sub_unit_types: [],
    },
};

describe('MapLegend', () => {
    const setSelectedOrgUnitTypes = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders org unit type checkboxes from the list', () => {
        renderWithThemeAndIntlProvider(
            <MapLegend
                orgUniTypeList={[orgUnitTypeA, orgUnitTypeB]}
                selectedOrgUnitTypes={[orgUnitTypeA]}
                setSelectedOrgUnitTypes={setSelectedOrgUnitTypes}
            />,
        );

        expect(screen.getByText('Org unit type')).toBeVisible();
        expect(screen.getByRole('checkbox', { name: 'Area' })).toBeChecked();
        expect(
            screen.getByRole('checkbox', { name: 'Facility' }),
        ).not.toBeChecked();
    });

    it('adds an org unit type when an unchecked box is toggled', () => {
        renderWithThemeAndIntlProvider(
            <MapLegend
                orgUniTypeList={[orgUnitTypeA, orgUnitTypeB]}
                selectedOrgUnitTypes={[orgUnitTypeA]}
                setSelectedOrgUnitTypes={setSelectedOrgUnitTypes}
            />,
        );

        fireEvent.click(screen.getByRole('checkbox', { name: 'Facility' }));

        expect(setSelectedOrgUnitTypes).toHaveBeenCalledTimes(1);
        const updater = setSelectedOrgUnitTypes.mock.calls[0][0];
        expect(updater([orgUnitTypeA])).toEqual([orgUnitTypeA, orgUnitTypeB]);
    });

    it('removes an org unit type when a checked box is toggled', () => {
        renderWithThemeAndIntlProvider(
            <MapLegend
                orgUniTypeList={[orgUnitTypeA, orgUnitTypeB]}
                selectedOrgUnitTypes={[orgUnitTypeA, orgUnitTypeB]}
                setSelectedOrgUnitTypes={setSelectedOrgUnitTypes}
            />,
        );

        fireEvent.click(screen.getByRole('checkbox', { name: 'Area' }));

        expect(setSelectedOrgUnitTypes).toHaveBeenCalledTimes(1);
        const updater = setSelectedOrgUnitTypes.mock.calls[0][0];
        expect(updater([orgUnitTypeA, orgUnitTypeB])).toEqual([orgUnitTypeB]);
    });
});
