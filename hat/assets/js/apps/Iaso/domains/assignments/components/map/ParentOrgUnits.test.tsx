import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrgUnitTypeHierarchyDropdownValue } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { ParentOrgUnits } from './ParentOrgUnits';

const mockUseGetParentOrgUnits = vi.fn();
const captureMarkerProps = vi.fn();
const captureGeoJsonProps = vi.fn();

vi.mock('Iaso/domains/assignments/hooks/requests/useGetParentOrgUnits', () => ({
    useGetParentOrgUnits: (...args: unknown[]) =>
        mockUseGetParentOrgUnits(...args),
}));

vi.mock('Iaso/hooks/useGetColors', () => ({
    useGetColors: () => ({ data: ['#111111', '#222222'] }),
    getColor: (_index: number, colors: string[]) => colors[0],
}));

vi.mock('react-leaflet', () => ({
    Pane: ({ children, name }: { children: React.ReactNode; name: string }) => (
        <div data-testid={name}>{children}</div>
    ),
    GeoJSON: ({
        onEachFeature,
    }: {
        onEachFeature?: (
            feature: unknown,
            layer: { on: (event: string, handler: () => void) => void },
        ) => void;
    }) => {
        captureGeoJsonProps({ onEachFeature });
        return <div data-testid="parent-shape" />;
    },
}));

vi.mock('Iaso/components/maps/markers/CircleMarkerComponent', () => ({
    __esModule: true,
    default: ({
        onClick,
        item,
    }: {
        onClick: () => void;
        item: { id: number; name: string };
    }) => {
        captureMarkerProps({ onClick, item });
        return (
            <button type="button" onClick={onClick} data-testid="parent-marker">
                {item.name}
            </button>
        );
    },
}));

const createOrgUnit = (
    overrides: Partial<PlanningOrgUnits> = {},
): PlanningOrgUnits => ({
    id: 1,
    name: 'OU',
    geo_json: undefined,
    has_geo_json: false,
    latitude: 0,
    longitude: 0,
    org_unit_type_id: 1,
    ...overrides,
});

const planning = {
    id: 42,
    target_org_unit_type_details: [{ id: 3, name: 'Target' }],
} as any;

const orgUniTypeList: OrgUnitTypeHierarchyDropdownValue[] = [
    {
        value: 1,
        label: 'Zone',
        original: {
            id: 1,
            name: 'Zone',
            short_name: 'Zone',
            depth: 1,
            category: 'admin',
            sub_unit_types: [],
        },
    },
    {
        value: 3,
        label: 'Target',
        original: {
            id: 3,
            name: 'Target',
            short_name: 'Target',
            depth: 1,
            category: 'admin',
            sub_unit_types: [],
        },
    },
];

const rootOrgUnit = createOrgUnit({ id: 100, name: 'Root' });

const parentShape = createOrgUnit({
    id: 200,
    name: 'Parent shape',
    has_geo_json: true,
    geo_json: { type: 'Polygon', coordinates: [] },
});

describe('ParentOrgUnits', () => {
    const handleClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetParentOrgUnits.mockReturnValue([
            {
                data: [parentShape],
                isLoading: false,
            },
        ]);
    });

    it('queries parent org units for non-target selected types', () => {
        renderWithThemeAndIntlProvider(
            <ParentOrgUnits
                orgUniTypeList={orgUniTypeList}
                planning={planning}
                selectedOrgUnitTypes={orgUniTypeList}
                rootOrgUnit={rootOrgUnit}
                canAssign
                handleClick={handleClick}
            />,
        );

        expect(mockUseGetParentOrgUnits).toHaveBeenCalledWith({
            orgUniParentId: 100,
            orgUnitTypeIds: [1],
        });
        expect(screen.getByTestId('parent-shape')).toBeInTheDocument();
    });

    it('calls handleClick when a parent shape is clicked and assignment is allowed', () => {
        renderWithThemeAndIntlProvider(
            <ParentOrgUnits
                orgUniTypeList={orgUniTypeList}
                planning={planning}
                selectedOrgUnitTypes={[orgUniTypeList[0]]}
                rootOrgUnit={rootOrgUnit}
                canAssign
                handleClick={handleClick}
            />,
        );

        const { onEachFeature } = captureGeoJsonProps.mock.calls[0][0];
        const layer = { on: vi.fn() };
        onEachFeature({}, layer);
        layer.on.mock.calls[0][1]();

        expect(handleClick).toHaveBeenCalledWith(parentShape);
    });

    it('calls handleClick when a parent marker is clicked and assignment is allowed', () => {
        const parentPoint = createOrgUnit({
            id: 201,
            name: 'Parent point',
            latitude: 10,
            longitude: 20,
        });

        mockUseGetParentOrgUnits.mockReturnValue([
            {
                data: [parentPoint],
                isLoading: false,
            },
        ]);

        renderWithThemeAndIntlProvider(
            <ParentOrgUnits
                orgUniTypeList={orgUniTypeList}
                planning={planning}
                selectedOrgUnitTypes={[orgUniTypeList[0]]}
                rootOrgUnit={rootOrgUnit}
                canAssign
                handleClick={handleClick}
            />,
        );

        fireEvent.click(screen.getByTestId('parent-marker'));

        expect(handleClick).toHaveBeenCalledWith(parentPoint);
    });
});
