import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';
import { Assignments } from './index';

const {
    mockUseParamsObject,
    mockUseGetPlanningDetails,
    mockUseGetTeam,
    mockUseGetAssignments,
    mockUseSaveAssignment,
    mockUseBulkDeleteAssignments,
    mockGoBack,
    mockRedirectToReplace,
    mockTabs,
    captureMapProps,
    captureTableProps,
    captureTeamTableProps,
    teamTableAutoSelectUser,
} = vi.hoisted(() => {
    const handleChangeTab = vi.fn();
    let activeTab: 'list' | 'map' = 'map';
    return {
        mockUseParamsObject: vi.fn(),
        mockUseGetPlanningDetails: vi.fn(),
        mockUseGetTeam: vi.fn(),
        mockUseGetAssignments: vi.fn(),
        mockUseSaveAssignment: vi.fn(),
        mockUseBulkDeleteAssignments: vi.fn(),
        mockGoBack: vi.fn(),
        mockRedirectToReplace: vi.fn(),
        mockTabs: {
            get tab() {
                return activeTab;
            },
            setTab(next: 'list' | 'map') {
                activeTab = next;
            },
            reset() {
                activeTab = 'map';
                handleChangeTab.mockClear();
            },
            handleChangeTab,
        },
        captureMapProps: vi.fn(),
        captureTableProps: vi.fn(),
        captureTeamTableProps: vi.fn(),
        teamTableAutoSelectUser: { enabled: false },
    };
});

vi.mock('Iaso/routing/hooks/useParamsObject', () => ({
    useParamsObject: mockUseParamsObject,
}));

vi.mock('Iaso/domains/plannings/hooks/requests/useGetPlanningDetails', () => ({
    useGetPlanningDetails: mockUseGetPlanningDetails,
}));

vi.mock('Iaso/domains/teams/hooks/requests/useGetTeams', () => ({
    useGetTeam: mockUseGetTeam,
}));

vi.mock('Iaso/domains/assignments/hooks/requests/useGetAssignments', () => ({
    useGetAssignments: mockUseGetAssignments,
}));

vi.mock('Iaso/domains/assignments/hooks/requests/useSaveAssignment', () => ({
    useSaveAssignment: mockUseSaveAssignment,
}));

vi.mock('Iaso/domains/assignments/hooks/requests/useBulkDeleteAssignments', () => ({
    useBulkDeleteAssignments: mockUseBulkDeleteAssignments,
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string; id?: string }) =>
                msg.defaultMessage ?? msg.id ?? '',
            formatNumber: (n: number) => n.toString(),
        }),
        useGoBack: () => mockGoBack,
        useRedirectToReplace: () => mockRedirectToReplace,
        useTabs: () => ({
            tab: mockTabs.tab,
            handleChangeTab: mockTabs.handleChangeTab,
        }),
    };
});

vi.mock('../../components/nav/TopBarComponent', () => ({
    __esModule: true,
    default: ({ title }: { title: string }) => (
        <div data-testid="top-bar">{title}</div>
    ),
}));

vi.mock('./components/AssignmentsMap', () => ({
    AssignmentsMap: (props: Record<string, unknown>) => {
        captureMapProps(props);
        return <div data-testid="assignments-map" />;
    },
}));

vi.mock('./components/AssignmentsTable', () => ({
    AssignmentsTable: (props: Record<string, unknown>) => {
        captureTableProps(props);
        return <div data-testid="assignments-table" />;
    },
}));

vi.mock('./components/teams/TeamTable', () => {
    const ReactImport = require('react') as typeof import('react');
    return {
        TeamTable: (props: {
            setSelectedUser: (u: {
                id: number;
                username: string;
                first_name: string;
                last_name: string;
                color: string;
                iaso_profile_id: number;
            }) => void;
        }) => {
            captureTeamTableProps(props);
            ReactImport.useEffect(() => {
                if (teamTableAutoSelectUser.enabled) {
                    props.setSelectedUser({
                        id: 1,
                        username: 'u',
                        first_name: 'U',
                        last_name: 'Ser',
                        color: '#000000',
                        iaso_profile_id: 1,
                    });
                }
            }, [props.setSelectedUser]);
            return ReactImport.createElement('div', {
                'data-testid': 'team-table',
            });
        },
    };
});

const defaultParams = {
    planningId: '42',
    tab: 'map' as const,
    pageSize: '20',
    page: '1',
};

const minimalPlanning = {
    id: 42,
    name: 'Test planning',
    forms: [] as number[],
    pipeline_uuids: [] as string[],
    assignments_count: 3,
    org_unit_details: { id: 1, name: 'Root OU' },
    team_details: { id: 9, name: 'Team', color: '#000' },
    target_org_unit_type_details: [{ id: 1, name: 'HF' }],
};

describe('Assignments page', () => {
    beforeAll(() => {
        vi.stubGlobal(
            'ResizeObserver',
            class ResizeObserverStub {
                observe = vi.fn();

                unobserve = vi.fn();

                disconnect = vi.fn();
            },
        );
    });

    beforeEach(() => {
        vi.clearAllMocks();
        teamTableAutoSelectUser.enabled = false;
        mockTabs.reset();
        mockUseParamsObject.mockReturnValue(defaultParams);
        mockUseGetPlanningDetails.mockReturnValue({
            data: minimalPlanning,
            isLoading: false,
        });
        mockUseGetTeam.mockReturnValue({
            data: { id: 9, name: 'Root team', color: '#111' },
            isLoading: false,
        });
        mockUseGetAssignments.mockReturnValue({
            data: { assignments: [], allAssignments: [] },
            isLoading: false,
        });
        mockUseSaveAssignment.mockReturnValue({
            handleSaveAssignment: vi.fn(),
            isLoading: false,
        });
        mockUseBulkDeleteAssignments.mockReturnValue({
            mutateAsync: vi.fn().mockResolvedValue(undefined),
        });
    });

    it('renders the top bar title with the planning name', () => {
        renderWithThemeAndIntlProvider(<Assignments />);

        expect(screen.getByTestId('top-bar')).toHaveTextContent(
            'Assignments for planning: Test planning',
        );
    });

    it('renders planning context and the delete-all control when planning is loaded', () => {
        renderWithThemeAndIntlProvider(<Assignments />);

        const heading = screen.getByRole('heading', { level: 6 });
        expect(heading).toHaveTextContent('Root OU');
        expect(heading).toHaveTextContent('HF');
        const deleteBtn = screen.getByRole('button', {
            name: 'Delete all assignments',
        });
        expect(deleteBtn).toBeEnabled();
    });

    it('disables delete all assignments when the count is zero', () => {
        mockUseGetPlanningDetails.mockReturnValue({
            data: { ...minimalPlanning, assignments_count: 0 },
            isLoading: false,
        });

        renderWithThemeAndIntlProvider(<Assignments />);

        expect(
            screen.getByRole('button', { name: 'Delete all assignments' }),
        ).toBeDisabled();
    });

    it('shows the map view when the map tab is active', () => {
        mockTabs.setTab('map');

        renderWithThemeAndIntlProvider(<Assignments />);

        expect(screen.getByTestId('assignments-map')).toBeInTheDocument();
        expect(screen.queryByTestId('assignments-table')).toBeNull();
        expect(captureMapProps.mock.calls[0][0]).toMatchObject({
            planningId: '42',
            canAssign: false,
        });
    });

    it('shows the list table when the list tab is active', () => {
        mockTabs.setTab('list');

        renderWithThemeAndIntlProvider(<Assignments />);

        expect(screen.getByTestId('assignments-table')).toBeInTheDocument();
        expect(screen.queryByTestId('assignments-map')).toBeNull();
    });

    it('passes canAssign true to the map after the team table selects a user', async () => {
        mockTabs.setTab('map');
        teamTableAutoSelectUser.enabled = true;

        renderWithThemeAndIntlProvider(<Assignments />);

        await waitFor(() => {
            const lastMap = captureMapProps.mock.calls.at(-1)?.[0] as {
                canAssign: boolean;
            };
            expect(lastMap?.canAssign).toBe(true);
        });
    });

    it('passes canAssign false to the list table when nothing is selected', () => {
        mockTabs.setTab('list');

        renderWithThemeAndIntlProvider(<Assignments />);

        expect(captureTableProps.mock.calls[0][0]).toMatchObject({
            canAssign: false,
            params: defaultParams,
        });
    });
});
