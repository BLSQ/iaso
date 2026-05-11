import React from 'react';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import moment from 'moment';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import 'moment/locale/fr';
import { object, mixed, string, array, number } from 'yup';
import { PlanningForm } from 'Iaso/domains/plannings/components/PlanningForm';
import MESSAGES from 'Iaso/domains/plannings/messages';
import { Planning } from 'Iaso/domains/plannings/types';
import { renderWithThemeAndIntlProvider } from '../../../tests/helpers';

vi.mock(
    '../../../../../../plugins/polio/js/src/components/Inputs/OrgUnitsSelect',
    () => ({
        OrgUnitsLevels: ({
            field,
        }: {
            field: { name: string; value: unknown; onChange: (e: any) => void };
        }) => (
            <input
                type="hidden"
                data-testid="org-unit-field"
                name={field.name}
                value={field.value == null ? '' : String(field.value)}
                onChange={field.onChange}
            />
        ),
    }),
);

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

vi.mock('Iaso/domains/plannings/hooks/validation', () => ({
    usePlanningValidation: () =>
        object({
            id: mixed(),
            name: string().required(),
            startDate: mixed().nullable(),
            endDate: mixed().nullable(),
            selectedOrgUnit: mixed().nullable(),
            selectedTeam: mixed().nullable(),
            forms: array().of(mixed()).min(1),
            project: number().nullable().required(),
            description: mixed().nullable(),
            publishingStatus: mixed().required(),
            pipelineUuids: array().nullable(),
            targetOrgUnitTypes: array().of(mixed()).min(1),
        }),
}));

const { mockUseGetFormsDropdownOptions } = vi.hoisted(() => ({
    mockUseGetFormsDropdownOptions: vi.fn(),
}));
vi.mock('Iaso/domains/forms/hooks/useGetFormsDropdownOptions', () => ({
    useGetFormsDropdownOptions: mockUseGetFormsDropdownOptions,
}));

const { mockUseGetPipelinesDropdown } = vi.hoisted(() => ({
    mockUseGetPipelinesDropdown: vi.fn(),
}));
vi.mock('Iaso/domains/openHexa/hooks/useGetPipelines', () => ({
    useGetPipelinesDropdown: mockUseGetPipelinesDropdown,
}));

const { mockUseGetOrgUnit } = vi.hoisted(() => ({
    mockUseGetOrgUnit: vi.fn(),
}));
vi.mock('Iaso/domains/orgUnits/components/TreeView/requests', () => ({
    useGetOrgUnit: mockUseGetOrgUnit,
}));

const { mockUseGetOrgUnitTypesHierarchy } = vi.hoisted(() => ({
    mockUseGetOrgUnitTypesHierarchy: vi.fn(),
}));
vi.mock(
    'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy',
    () => ({
        useGetOrgUnitTypesHierarchy: mockUseGetOrgUnitTypesHierarchy,
    }),
);

const { mockUseGetTeamsDropdown } = vi.hoisted(() => ({
    mockUseGetTeamsDropdown: vi.fn(),
}));
vi.mock('Iaso/domains/teams/hooks/requests/useGetTeams', () => ({
    useGetTeamsDropdown: mockUseGetTeamsDropdown,
}));

const { mockUseGetProjectsDropDown } = vi.hoisted(() => ({
    mockUseGetProjectsDropDown: vi.fn(),
}));
vi.mock('Iaso/domains/projects/hooks/requests/useGetProjectsDropDown', () => ({
    useGetProjectsDropDown: mockUseGetProjectsDropDown,
}));

vi.mock(
    'Iaso/domains/assignments/hooks/requests/useBulkDeleteAssignments',
    () => ({
        useBulkDeleteAssignments: () => ({ mutateAsync: vi.fn() }),
    }),
);

vi.mock('Iaso/domains/plannings/hooks/requests/useDeletePlanning', () => ({
    useDeletePlanning: () => ({ mutateAsync: vi.fn() }),
}));

const FORMS_DROPDOWN = {
    data: [
        {
            value: 10,
            label: 'Form One',
            original: { project_ids: [300], org_unit_type_ids: [] },
        },
    ],
    isFetching: false,
} as const;

const TEAMS_DROPDOWN = {
    data: [{ value: 200, label: 'Team A', original: { project: 300 } }],
    isFetching: false,
} as const;

const PROJECTS_DROPDOWN = {
    data: [{ value: 300, label: 'Project X' }],
    isFetching: false,
} as const;

const ORG_UNIT_TYPES = {
    data: [{ value: 400, label: 'Type 1' }],
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
        forms: [10],
        assignments_count: 0,
        pipeline_uuids: [],
        org_unit_details: { id: 100, name: 'Root OU' },
        team_details: { id: 200, name: 'Team A' },
        project_details: { id: 300, name: 'Project X' },
        description: 'Initial description',
        target_org_unit_type_details: [{ id: 400, name: 'Type 1' }],
        ...overrides,
    };
};

const renderForm = (props: {
    hasPipelineConfig?: boolean;
    planning?: Planning;
    mode: 'edit' | 'create' | 'copy';
}) =>
    renderWithThemeAndIntlProvider(
        <MemoryRouter>
            <LocalizationProvider
                dateAdapter={AdapterMoment}
                adapterLocale="fr"
            >
                <PlanningForm
                    hasPipelineConfig={props.hasPipelineConfig ?? false}
                    planning={props.planning}
                    mode={props.mode}
                />
            </LocalizationProvider>
        </MemoryRouter>,
    );

describe('PlanningForm integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        moment.locale('fr');
        mockSavePlanning.mockResolvedValue({});

        mockUseGetFormsDropdownOptions.mockReturnValue(FORMS_DROPDOWN);
        mockUseGetPipelinesDropdown.mockReturnValue({
            data: [],
            isFetching: false,
        });
        mockUseGetOrgUnit.mockReturnValue({
            data: { org_unit_type_id: 1, name: 'OU', id: 100 },
            isFetching: false,
        });
        mockUseGetOrgUnitTypesHierarchy.mockReturnValue(ORG_UNIT_TYPES);
        mockUseGetTeamsDropdown.mockReturnValue(TEAMS_DROPDOWN);
        mockUseGetProjectsDropDown.mockReturnValue(PROJECTS_DROPDOWN);
    });

    afterEach(() => {
        moment.locale('en');
    });

    it('does not show the active published planning warning when only non-warning fields change', async () => {
        const user = userEvent.setup();
        const planning = buildPublishedActivePlanning();
        renderForm({ planning, mode: 'edit' });

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
        renderForm({ planning, mode: 'edit' });

        const draftRadio = await screen.findByRole('radio', {
            name: MESSAGES.draft.defaultMessage,
        });
        await act(async () => {
            await user.click(draftRadio);
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
        renderForm({ planning, mode: 'edit' });

        const publishedRadio = await screen.findByRole('radio', {
            name: MESSAGES.published.defaultMessage,
        });
        await act(async () => {
            await user.click(publishedRadio);
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
