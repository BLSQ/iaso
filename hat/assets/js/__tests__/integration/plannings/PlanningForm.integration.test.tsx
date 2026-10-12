import React from 'react';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import moment from 'moment';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import 'moment/locale/fr';
import { PlanningForm } from 'Iaso/domains/plannings/components/PlanningForm';
import { PlanningHeader } from 'Iaso/domains/plannings/components/PlanningHeader';
import { PlanningProvider } from 'Iaso/domains/plannings/contexts/PlanningContext';
import MESSAGES from 'Iaso/domains/plannings/messages';
import { Planning } from 'Iaso/domains/plannings/types';
import { renderWithThemeAndIntlProvider } from '../../../tests/helpers';

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useRedirectTo: () => vi.fn(),
        useRedirectToReplace: () => vi.fn(),
    };
});

const { mockSavePlanning } = vi.hoisted(() => ({
    mockSavePlanning: vi.fn().mockResolvedValue({}),
}));

vi.mock(
    'Iaso/domains/plannings/hooks/requests/useSavePlanning',
    async importOriginal => {
        const actual =
            await importOriginal<
                typeof import('Iaso/domains/plannings/hooks/requests/useSavePlanning')
            >();
        return {
            ...actual,
            useSavePlanning: () => ({ mutateAsync: mockSavePlanning }),
        };
    },
);

const { mockUseGetPlanningDetails } = vi.hoisted(() => ({
    mockUseGetPlanningDetails: vi.fn(),
}));
vi.mock('Iaso/domains/plannings/hooks/requests/useGetPlanningDetails', () => ({
    useGetPlanningDetails: mockUseGetPlanningDetails,
}));

vi.mock('Iaso/api/missions', () => ({
    useApiMicroplanningMissionsList: () => ({
        data: undefined,
        isFetching: false,
    }),
    useApiMicroplanningMissionsRetrieve: () => ({ data: undefined }),
}));

const { mockUseGetProjectsDropDown } = vi.hoisted(() => ({
    mockUseGetProjectsDropDown: vi.fn(),
}));
vi.mock('Iaso/domains/projects/hooks/requests/useGetProjectsDropDown', () => ({
    useGetProjectsDropDown: mockUseGetProjectsDropDown,
}));

const PROJECTS_DROPDOWN = {
    data: [{ value: 300, label: 'Project X' }],
    isFetching: false,
} as const;

const buildPublishedActivePlanning = (
    overrides: Partial<Planning> = {},
): Planning => {
    const now = moment();
    return {
        id: 1,
        name: 'Test planning',
        started_at: now
            .clone()
            .subtract(10, 'days')
            .startOf('day')
            .toISOString(),
        ended_at: now.clone().add(10, 'days').endOf('day').toISOString(),
        published_at: now.clone().subtract(1, 'day').toISOString(),
        missions: [10],
        assignments_count: 0,
        pipeline_uuids: [],
        project_details: { id: 300, name: 'Project X' },
        org_unit_details: { id: 400, name: 'Org unit X' },
        team_details: { id: 500, name: 'Team X' },
        description: 'Initial description',
        ...overrides,
    };
};

const renderForm = (planning: Planning) => {
    mockUseGetPlanningDetails.mockReturnValue({
        data: planning,
        isLoading: false,
        isFetching: false,
    });
    return renderWithThemeAndIntlProvider(
        <MemoryRouter>
            <LocalizationProvider
                dateAdapter={AdapterMoment}
                adapterLocale="fr"
            >
                <PlanningProvider planningId={`${planning.id}`} mode="edit">
                    <PlanningHeader />
                    <PlanningForm />
                </PlanningProvider>
            </LocalizationProvider>
        </MemoryRouter>,
    );
};

describe('PlanningForm integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        moment.locale('fr');
        mockSavePlanning.mockResolvedValue({});

        mockUseGetProjectsDropDown.mockReturnValue(PROJECTS_DROPDOWN);
    });

    afterEach(() => {
        moment.locale('en');
    });

    it('does not show the active published planning warning when only non-warning fields change', async () => {
        const user = userEvent.setup();
        const planning = buildPublishedActivePlanning();
        renderForm(planning);

        const nameField = await screen.findByRole('textbox', {
            name: new RegExp(`^${MESSAGES.name.defaultMessage}`),
        });
        await act(async () => {
            await user.clear(nameField);
            await user.type(nameField, 'Renamed planning only');
        });

        const saveButton = screen.getByRole('button', {
            name: MESSAGES.save.defaultMessage,
        });
        await waitFor(() => {
            expect(saveButton).not.toBeDisabled();
        });

        await act(async () => {
            await user.click(saveButton);
        });

        await waitFor(() => {
            expect(mockSavePlanning).toHaveBeenCalled();
        });
        expect(
            screen.queryByRole('heading', {
                name: MESSAGES.planningWarningTitle.defaultMessage,
            }),
        ).not.toBeInTheDocument();
    });

    it('shows the warning dialog when a published active planning is edited and a watched field changes', async () => {
        const user = userEvent.setup();
        const planning = buildPublishedActivePlanning();
        renderForm(planning);

        const draftToggle = await screen.findByRole('button', {
            name: MESSAGES.draft.defaultMessage,
        });
        await act(async () => {
            await user.click(draftToggle);
        });

        const saveButton = screen.getByRole('button', {
            name: MESSAGES.save.defaultMessage,
        });
        await waitFor(() => {
            expect(saveButton).not.toBeDisabled();
        });

        await act(async () => {
            await user.click(saveButton);
        });

        expect(
            await screen.findByText(
                MESSAGES.planningWarningMessage.defaultMessage,
            ),
        ).toBeInTheDocument();
        expect(mockSavePlanning).not.toHaveBeenCalled();

        const confirmButton = screen.getByRole('button', {
            name: MESSAGES.confirm.defaultMessage,
        });
        await act(async () => {
            await user.click(confirmButton);
        });

        await waitFor(() => {
            expect(mockSavePlanning).toHaveBeenCalled();
        });
    });

    it('does not show the warning for a draft planning even when watched fields change', async () => {
        const user = userEvent.setup();
        const planning = buildPublishedActivePlanning({
            published_at: undefined,
        });
        renderForm(planning);

        const publishedToggle = await screen.findByRole('button', {
            name: MESSAGES.published.defaultMessage,
        });
        await act(async () => {
            await user.click(publishedToggle);
        });

        const saveButton = screen.getByRole('button', {
            name: MESSAGES.save.defaultMessage,
        });
        await waitFor(() => {
            expect(saveButton).not.toBeDisabled();
        });

        await act(async () => {
            await user.click(saveButton);
        });

        await waitFor(() => {
            expect(mockSavePlanning).toHaveBeenCalled();
        });
        expect(
            screen.queryByText(MESSAGES.planningWarningMessage.defaultMessage),
        ).not.toBeInTheDocument();
    });
});
