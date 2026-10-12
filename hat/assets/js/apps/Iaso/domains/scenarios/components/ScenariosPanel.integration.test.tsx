import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ScenarioList } from 'Iaso/api/scenarios';
import {
    getApiScenariosCreateMockHandler,
    getApiScenariosCreateResponseMock,
    getApiScenariosListMockHandler,
    getApiScenariosRunCreateMockHandler,
} from 'Iaso/api/scenarios/endpoints/scenarios/scenarios.msw';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../../tests/helpers';
import { ScenariosPanel } from './ScenariosPanel';

const ENTITY_TYPE_ID = 3;
const WORKFLOW_VERSION_ID = 12;

const scenario = (overrides: Partial<ScenarioList>): ScenarioList => ({
    id: 1,
    name: 'Oedema leads to OTP',
    description: '',
    kind: 'entity',
    entity_type_id: ENTITY_TYPE_ID,
    steps_count: 2,
    forms: ['child_registration', 'anthropometry'],
    journey: ['Child registration', 'Anthropometry'],
    last_run_at: null,
    last_run_status: '',
    last_run_workflow_version_id: null,
    last_run_failed_step: null,
    last_run_failures: [],
    created_at: '2026-10-10T08:00:00Z',
    updated_at: '2026-10-10T08:00:00Z',
    ...overrides,
});

const NOT_RUN = scenario({});
const FAILED = scenario({
    id: 2,
    name: 'Oedema forgotten',
    last_run_at: '2026-10-10T09:00:00Z',
    last_run_status: 'failed',
    last_run_workflow_version_id: WORKFLOW_VERSION_ID,
    last_run_failed_step: 2,
    last_run_failures: [
        "Step 2: 'oedema_status' should be 'yes', was 'no' (copied from 'oedema')",
    ],
});

const listRequests = vi.fn();
const runRequests = vi.fn();
const createRequests = vi.fn();

const server = setupServer();
const previousDefaults = TestingQueryClient.getDefaultOptions();

const useScenarios = (scenarios: ScenarioList[]) =>
    server.use(
        getApiScenariosListMockHandler(info => {
            listRequests(new URL(info.request.url).searchParams.toString());
            return { results: scenarios };
        }),
    );

const renderPanel = () =>
    renderWithThemeAndIntlProvider(
        <MemoryRouter>
            <ScenariosPanel
                entityTypeId={ENTITY_TYPE_ID}
                workflowVersionId={WORKFLOW_VERSION_ID}
                params={{}}
                baseUrl="workflows/details"
            />
        </MemoryRouter>,
    );

describe('ScenariosPanel', () => {
    beforeAll(() => {
        TestingQueryClient.setDefaultOptions({ queries: { retry: false } });
        server.listen({ onUnhandledRequest: 'error' });
    });

    afterEach(() => {
        server.resetHandlers();
        TestingQueryClient.clear();
        vi.clearAllMocks();
    });

    afterAll(() => {
        server.close();
        TestingQueryClient.setDefaultOptions(previousDefaults);
    });

    it("lists the entity type's entity scenarios with their last result", async () => {
        useScenarios([NOT_RUN, FAILED]);

        renderPanel();

        const failedRow = (await screen.findByText('Oedema forgotten')).closest(
            'tr',
        );
        expect(failedRow).not.toBeNull();
        expect(
            within(failedRow as HTMLElement).getByText('Failed at step 2'),
        ).toBeInTheDocument();
        expect(
            within(failedRow as HTMLElement).getByText(
                "Step 2: 'oedema_status' should be 'yes', was 'no' (copied from 'oedema')",
            ),
        ).toBeInTheDocument();
        const notRunRow = screen.getByText('Oedema leads to OTP').closest('tr');
        expect(
            within(notRunRow as HTMLElement).getByText('Not run'),
        ).toBeInTheDocument();
        expect(
            within(notRunRow as HTMLElement).getByText('Child registration'),
        ).toBeInTheDocument();
        expect(listRequests).toHaveBeenCalledWith(
            `entity_type_id=${ENTITY_TYPE_ID}&kind=entity`,
        );
    });

    it('explains how to start when there are no scenarios', async () => {
        useScenarios([]);

        renderPanel();

        expect(
            await screen.findByText(
                'No scenarios yet: import scenario files (.json) to test this workflow.',
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Run all' })).toBeDisabled();
    });

    it('runs all the scenarios against this workflow version', async () => {
        useScenarios([NOT_RUN, FAILED]);
        server.use(
            getApiScenariosRunCreateMockHandler(async info => {
                runRequests(await info.request.json());
                return { results: [] };
            }),
        );

        renderPanel();
        await screen.findByText('Oedema forgotten');
        await userEvent.click(screen.getByRole('button', { name: 'Run all' }));

        await waitFor(() =>
            expect(runRequests).toHaveBeenCalledWith({
                scenario_ids: [NOT_RUN.id, FAILED.id],
                workflow_version_id: WORKFLOW_VERSION_ID,
            }),
        );
    });

    it('imports a scenario file into the account', async () => {
        useScenarios([]);
        server.use(
            getApiScenariosCreateMockHandler(async info => {
                createRequests(await info.request.json());
                return getApiScenariosCreateResponseMock();
            }),
        );
        const definition = { kind: 'entity', name: 'Imported', steps: [] };
        const file = new File([JSON.stringify(definition)], 'scenario.json', {
            type: 'application/json',
        });

        renderPanel();
        await waitFor(() =>
            expect(
                screen.getByRole('button', { name: 'Import' }),
            ).toBeEnabled(),
        );
        await userEvent.upload(
            screen.getByTestId('import-scenarios-input'),
            file,
        );

        await waitFor(() =>
            expect(createRequests).toHaveBeenCalledWith({
                definition,
            }),
        );
    });

    it("skips a file that isn't JSON and imports the next ones", async () => {
        useScenarios([]);
        server.use(
            getApiScenariosCreateMockHandler(async info => {
                createRequests(await info.request.json());
                return getApiScenariosCreateResponseMock();
            }),
        );
        const definition = { kind: 'entity', name: 'Imported', steps: [] };
        const files = [
            new File(['not json'], 'notes.json', { type: 'application/json' }),
            new File([JSON.stringify(definition)], 'scenario.json', {
                type: 'application/json',
            }),
        ];

        renderPanel();
        await waitFor(() =>
            expect(
                screen.getByRole('button', { name: 'Import' }),
            ).toBeEnabled(),
        );
        await userEvent.upload(
            screen.getByTestId('import-scenarios-input'),
            files,
        );

        // files are imported one by one: once the second one is sent, the first one was skipped
        await waitFor(() =>
            expect(createRequests).toHaveBeenCalledWith({
                definition,
            }),
        );
        expect(createRequests).toHaveBeenCalledTimes(1);
    });
});
