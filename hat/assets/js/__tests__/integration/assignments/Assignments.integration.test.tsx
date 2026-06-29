import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { delay, HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { Assignments } from 'Iaso/domains/assignments';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../tests/helpers';

const { mockUseParamsObject } = vi.hoisted(() => ({
    mockUseParamsObject: vi.fn(),
}));

vi.mock('Iaso/routing/hooks/useParamsObject', () => ({
    useParamsObject: mockUseParamsObject,
}));

const defaultParams = {
    accountId: '1',
    planningId: '42',
    tab: 'map' as const,
    pageSize: '20',
    page: '1',
};

const planning = {
    id: 42,
    name: 'Test planning',
    forms: [],
    pipeline_uuids: [],
    assignments_count: 2,
    org_unit_details: { id: 1, name: 'Root OU', org_unit_type: 1 },
    team_details: { id: 9, name: 'Team', color: '#000' },
    target_org_unit_type_details: [{ id: 2, name: 'HF' }],
};

const rootTeam = {
    id: 9,
    name: 'Root team',
    manager: 1,
    sub_teams: [],
    sub_teams_details: [],
    project: 1,
    users: [],
    users_details: [],
    created_at: '2024-01-01',
    color: '#111111',
};

const server = setupServer(
    http.get('*/api/microplanning/plannings/42/', async () => {
        await delay(
            process.env.MSW_DELAY ? parseInt(process.env.MSW_DELAY, 10) : 0,
        );
        return HttpResponse.json(planning);
    }),
    http.get('*/api/microplanning/assignments/', () => HttpResponse.json([])),
    http.get('*/api/teams/9/', () => HttpResponse.json(rootTeam)),
    http.get('*/api/microplanning/plannings/42/orgunits/children/', () =>
        HttpResponse.json([]),
    ),
    http.get('*/api/microplanning/plannings/42/orgunits/root/', () =>
        HttpResponse.json({
            id: 1,
            name: 'Root OU',
            geo_json: null,
        }),
    ),
    http.get('*/api/forms/', () => HttpResponse.json({ forms: [] })),
    http.get('*/api/v2/orgunittypes/1/hierarchy/', () =>
        HttpResponse.json({ sub_unit_types: [] }),
    ),
    http.get('*/api/colors/', () => HttpResponse.json([])),
);

const previousDefaults = TestingQueryClient.getDefaultOptions();

describe('Assignments integration tests', () => {
    beforeAll(() => {
        TestingQueryClient.setDefaultOptions({
            queries: {
                retry: false,
            },
        });
        server.listen({
            onUnhandledRequest: 'error',
        });
        vi.stubGlobal(
            'ResizeObserver',
            class ResizeObserverStub {
                observe = vi.fn();

                unobserve = vi.fn();

                disconnect = vi.fn();
            },
        );
    });

    afterEach(() => {
        server.resetHandlers();
        TestingQueryClient.clear();
    });

    afterAll(() => {
        server.close();
        TestingQueryClient.setDefaultOptions(previousDefaults);
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
        mockUseParamsObject.mockReturnValue(defaultParams);
    });

    const renderAssignments = () =>
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <Assignments />
            </MemoryRouter>,
        );

    it('displays a loading spinner when loading', () => {
        vi.stubEnv('MSW_DELAY', '100000000');
        renderAssignments();

        expect(screen.getByRole('progressbar')).toBeVisible();
    });

    it('renders planning context and delete-all control when data is loaded', async () => {
        renderAssignments();

        await waitFor(() => {
            expect(
                screen.getByText('Assignments for planning: Test planning'),
            ).toBeVisible();
        });

        expect(screen.getByText(/Root OU/)).toBeVisible();
        expect(screen.getByText(/HF/)).toBeVisible();
        expect(
            screen.getByRole('button', { name: 'Delete all assignments' }),
        ).toBeEnabled();
    });

    it('disables delete all assignments when the count is zero', async () => {
        server.use(
            http.get('*/api/microplanning/plannings/42/', () =>
                HttpResponse.json({
                    ...planning,
                    assignments_count: 0,
                }),
            ),
        );

        renderAssignments();

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Delete all assignments' }),
            ).toBeDisabled();
        });
    });

    it('renders map and list tabs', async () => {
        renderAssignments();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByRole('tab', { name: 'Map' })).toBeVisible();
        expect(screen.getByRole('tab', { name: 'List' })).toBeVisible();
    });
});
