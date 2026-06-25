import React from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { AssignmentsMap } from './AssignmentsMap';

const {
    mockUseGetPlanningOrgUnitsChildren,
    mockUseGetPlanningOrgUnitsRoot,
    captureBulkAssignDialogProps,
    captureMapToolsProps,
    captureParentOrgUnitsProps,
    captureTargetOrgUnitsProps,
} = vi.hoisted(() => ({
    mockUseGetPlanningOrgUnitsChildren: vi.fn(),
    mockUseGetPlanningOrgUnitsRoot: vi.fn(),
    captureBulkAssignDialogProps: vi.fn(),
    captureMapToolsProps: vi.fn(),
    captureParentOrgUnitsProps: vi.fn(),
    captureTargetOrgUnitsProps: vi.fn(),
}));

vi.mock('../../../teams/hooks/requests/useGetPlanningOrgUnits', () => ({
    useGetPlanningOrgUnitsChildren: (...args: unknown[]) =>
        mockUseGetPlanningOrgUnitsChildren(...args),
    useGetPlanningOrgUnitsRoot: (...args: unknown[]) =>
        mockUseGetPlanningOrgUnitsRoot(...args),
}));

vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="map-container">{children}</div>
    ),
    GeoJSON: () => <div data-testid="root-geojson" />,
    Pane: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../dialog/BulkAssignDialog', () => ({
    BulkAssignDialog: (props: Record<string, unknown>) => {
        captureBulkAssignDialogProps(props);
        return props.open ? <div data-testid="bulk-assign-dialog" /> : null;
    },
}));

vi.mock('./MapTools', () => ({
    MapTools: (props: Record<string, unknown>) => {
        captureMapToolsProps(props);
        return <div data-testid="map-tools" />;
    },
}));

vi.mock('./ParentOrgUnits', () => ({
    ParentOrgUnits: (props: Record<string, unknown>) => {
        captureParentOrgUnitsProps(props);
        return <div data-testid="parent-org-units" />;
    },
}));

vi.mock('./TargetOrgUnits', () => ({
    TargetOrgUnits: (props: Record<string, unknown>) => {
        captureTargetOrgUnitsProps(props);
        return <div data-testid="target-org-units" />;
    },
}));

const defaultParams = {
    planningId: '42',
    tab: 'map' as const,
    pageSize: '20',
    page: '1',
};

const planning = {
    id: 42,
    name: 'Test planning',
    target_org_unit_type_details: [{ id: 2, name: 'Area' }],
    org_unit_details: { id: 1, name: 'Root' },
} as any;

describe('AssignmentsMap', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetPlanningOrgUnitsChildren.mockReturnValue({
            data: [],
            isFetching: false,
        });
        mockUseGetPlanningOrgUnitsRoot.mockReturnValue({
            data: {
                id: 1,
                name: 'Root',
                geo_json: { type: 'Polygon', coordinates: [] },
            },
            isFetching: false,
        });
    });

    it('renders map layers and passes core props to child components', () => {
        renderWithThemeAndIntlProvider(
            <AssignmentsMap
                planningId="42"
                isLoadingRootTeam={false}
                isLoadingAssignments={false}
                handleSaveAssignment={vi.fn()}
                isSaving={false}
                canAssign
                planning={planning}
                params={defaultParams}
                selectedOrgUnitTypes={[]}
                setSelectedOrgUnitTypes={vi.fn()}
            />,
        );

        expect(screen.getByTestId('map-container')).toBeInTheDocument();
        expect(screen.getByTestId('map-tools')).toBeInTheDocument();
        expect(screen.getByTestId('parent-org-units')).toBeInTheDocument();
        expect(screen.getByTestId('target-org-units')).toBeInTheDocument();
        expect(screen.getByTestId('root-geojson')).toBeInTheDocument();

        expect(captureTargetOrgUnitsProps.mock.calls[0][0]).toMatchObject({
            canAssign: true,
            planning,
        });
    });

    it('shows a loading spinner while data is loading', () => {
        mockUseGetPlanningOrgUnitsChildren.mockReturnValue({
            data: undefined,
            isFetching: true,
        });

        renderWithThemeAndIntlProvider(
            <AssignmentsMap
                planningId="42"
                isLoadingRootTeam={false}
                isLoadingAssignments={false}
                handleSaveAssignment={vi.fn()}
                isSaving={false}
                canAssign={false}
                planning={planning}
                params={defaultParams}
                selectedOrgUnitTypes={[]}
                setSelectedOrgUnitTypes={vi.fn()}
            />,
        );

        expect(screen.getByRole('progressbar')).toBeVisible();
    });

    it('adds the can-assign CSS class when assignment is allowed', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <AssignmentsMap
                planningId="42"
                isLoadingRootTeam={false}
                isLoadingAssignments={false}
                handleSaveAssignment={vi.fn()}
                isSaving={false}
                canAssign
                planning={planning}
                params={defaultParams}
                selectedOrgUnitTypes={[]}
                setSelectedOrgUnitTypes={vi.fn()}
            />,
        );

        expect(
            container.querySelector('.assignments-map--can-assign'),
        ).toBeTruthy();
    });
});
