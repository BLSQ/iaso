import React from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanningOrgUnits } from 'Iaso/domains/plannings/types';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { TargetOrgUnits } from './TargetOrgUnits';

const captureMapShapeProps = vi.fn();
const captureMapLocationProps = vi.fn();

vi.mock('react-leaflet', () => ({
    Pane: ({ children, name }: { children: React.ReactNode; name: string }) => (
        <div data-testid={`pane-${name}`}>{children}</div>
    ),
}));

vi.mock('Iaso/domains/app/hooks/useGetAssignmentColor', () => ({
    useGetAssignmentColor: () => (id: number) =>
        id === 1 ? '#assigned' : '#unassigned',
}));

vi.mock('./MapShape', () => ({
    MapShape: (props: { ou: PlanningOrgUnits }) => {
        captureMapShapeProps(props);
        return <div data-testid={`shape-${props.ou.id}`} />;
    },
}));

vi.mock('./MapLocation', () => ({
    MapLocation: (props: { ou: PlanningOrgUnits }) => {
        captureMapLocationProps(props);
        return <div data-testid={`location-${props.ou.id}`} />;
    },
}));

const selectedTypes = [{ value: 2, label: 'Area', original: {} }] as Parameters<
    typeof TargetOrgUnits
>[0]['selectedOrgUnitTypes'];

const createOrgUnit = (
    overrides: Partial<PlanningOrgUnits> = {},
): PlanningOrgUnits => ({
    id: 1,
    name: 'OU',
    geo_json: undefined,
    has_geo_json: false,
    latitude: 0,
    longitude: 0,
    org_unit_type_id: 2,
    ...overrides,
});

const shapeAssigned = createOrgUnit({
    id: 1,
    name: 'Assigned shape',
    has_geo_json: true,
    geo_json: { type: 'Polygon', coordinates: [] },
});

const shapeUnassigned = createOrgUnit({
    id: 2,
    name: 'Unassigned shape',
    has_geo_json: true,
    geo_json: { type: 'Polygon', coordinates: [] },
});

const pointAssigned = createOrgUnit({
    id: 3,
    name: 'Assigned point',
    latitude: 10,
    longitude: 20,
});

const pointUnassigned = createOrgUnit({
    id: 4,
    name: 'Unassigned point',
    latitude: 11,
    longitude: 21,
});

const assignments = {
    assignments: [],
    allAssignments: [
        {
            id: 10,
            planning: 42,
            org_unit: 1,
            user: 5,
            team: 0,
            org_unit_details: {
                id: 1,
                name: 'Assigned shape',
                geo_json: null,
                latitude: null,
                longitude: null,
            },
        },
        {
            id: 11,
            planning: 42,
            org_unit: 3,
            user: 0,
            team: 7,
            org_unit_details: {
                id: 3,
                name: 'Assigned point',
                geo_json: null,
                latitude: null,
                longitude: null,
            },
        },
    ],
};

describe('TargetOrgUnits', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders assigned and unassigned shapes and points in separate panes', () => {
        renderWithThemeAndIntlProvider(
            <TargetOrgUnits
                orgUnits={[
                    shapeAssigned,
                    shapeUnassigned,
                    pointAssigned,
                    pointUnassigned,
                ]}
                canAssign
                handleSaveAssignment={vi.fn()}
                planning={
                    {
                        target_org_unit_type_details: [{ id: 2, name: 'Area' }],
                    } as any
                }
                assignments={assignments as any}
                selectedOrgUnitTypes={selectedTypes}
            />,
        );

        expect(
            screen.getByTestId('pane-target-org-units-shapes-unassigned'),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId('pane-target-org-units-shapes-assigned'),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId('pane-target-org-units-points-unassigned'),
        ).toBeInTheDocument();
        expect(
            screen.getByTestId('pane-target-org-units-points-assigned'),
        ).toBeInTheDocument();

        expect(screen.getByTestId('shape-2')).toBeInTheDocument();
        expect(screen.getByTestId('shape-1')).toBeInTheDocument();
        expect(screen.getByTestId('location-4')).toBeInTheDocument();
        expect(screen.getByTestId('location-3')).toBeInTheDocument();
    });

    it('passes canAssign and handleSaveAssignment to map child components', () => {
        const handleSaveAssignment = vi.fn();

        renderWithThemeAndIntlProvider(
            <TargetOrgUnits
                orgUnits={[shapeUnassigned]}
                canAssign
                handleSaveAssignment={handleSaveAssignment}
                planning={
                    {
                        target_org_unit_type_details: [{ id: 2, name: 'Area' }],
                    } as any
                }
                assignments={{ assignments: [], allAssignments: [] }}
                selectedOrgUnitTypes={selectedTypes}
            />,
        );

        expect(captureMapShapeProps.mock.calls[0][0]).toMatchObject({
            canAssign: true,
            handleSaveAssignment,
        });
    });
});
