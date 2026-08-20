import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import * as useGetGroupsModule from '../../orgUnits/hooks/requests/useGetGroups';
import { userHasAccessToModule } from '../../users/utils';
import FormForm from './FormFormComponent';

vi.mock('../../projects/hooks/requests', () => ({
    useGetProjectsDropdownOptions: vi.fn(() => ({
        data: [{ value: 1, label: 'Project 1' }],
        isFetching: false,
    })),
}));
vi.mock(
    '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions',
    () => ({
        useGetOrgUnitTypesDropdownOptions: vi.fn(() => ({
            data: [{ value: 1, label: 'Org unit type 1' }],
            isFetching: false,
        })),
    }),
);

vi.mock('../../orgUnits/hooks/requests/useGetGroups', () => ({
    useGetGroupDropdown: vi.fn(),
}));

vi.mock(
    'Iaso/components/validationWorkflows/ValidationWorkflowDropdown',
    () => ({
        ValidationWorkflowDropdown: () => null,
    }),
);

vi.mock('./FormLegendInput', () => ({
    FormLegendInput: () => null,
}));

vi.mock('../../../components/DisplayIfUserHasPerm', () => ({
    DisplayIfUserHasPerm: ({ children }: { children: React.ReactNode }) =>
        children,
}));

vi.mock('../../instances/utils', () => ({
    formatLabel: (field: { name: string }) => field.name,
}));

vi.mock('../../../components/forms/InputComponent', () => ({
    default: ({
        keyValue,
        onChange,
        value,
        options,
        disabled,
        loading,
    }: Record<string, any>) => (
        <div data-testid={`input-${keyValue}`}>
            <input
                data-testid={`input-field-${keyValue}`}
                disabled={Boolean(disabled || loading)}
                value={value ?? ''}
                onChange={event => onChange(keyValue, event.target.value)}
            />
            <span data-testid={`options-count-${keyValue}`}>
                {options ? options.length : 0}
            </span>
        </div>
    ),
}));

vi.mock('../../users/utils', async () => {
    const actual = await vi.importActual('../../users/utils');

    return {
        ...actual,
        userHasAccessToModule: vi.fn(),
    };
});

const mockUseGetGroupDropdown = vi.mocked(
    useGetGroupsModule.useGetGroupDropdown,
) as any;

const makeField = (value: any) => ({ value, errors: [] });

const makeForm = (overrides: Record<string, any> = {}) => ({
    id: makeField(null),
    name: makeField('My form'),
    short_name: makeField(''),
    depth: makeField(null),
    org_unit_type_ids: makeField([]),
    org_unit_group_ids: makeField([]),
    project_ids: makeField([]),
    period_type: makeField(null),
    derived: makeField(false),
    single_per_period: makeField(false),
    periods_before_allowed: makeField(0),
    periods_after_allowed: makeField(0),
    device_field: makeField('deviceid'),
    location_field: makeField(''),
    possible_fields: makeField([]),
    label_keys: makeField([]),
    legend_threshold: makeField(null),
    change_request_mode: makeField('CR_MODE_NONE'),
    validation_workflow: makeField(null),
    ...overrides,
});

describe('FormFormComponent - org unit groups', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetGroupDropdown.mockReturnValue({
            data: [
                { value: 1, label: 'Group 1' },
                { value: 2, label: 'Group 2' },
            ],
            isFetching: false,
        });
    });

    it('renders the org unit groups field', () => {
        renderWithThemeAndIntlProvider(
            <FormForm currentForm={makeForm()} setFieldValue={vi.fn()} />,
        );
        expect(
            screen.getByTestId('input-org_unit_group_ids'),
        ).toBeInTheDocument();
    });

    it('disables the org unit groups field when no project is selected', () => {
        renderWithThemeAndIntlProvider(
            <FormForm currentForm={makeForm()} setFieldValue={vi.fn()} />,
        );
        expect(
            screen.getByTestId('input-field-org_unit_group_ids'),
        ).toBeDisabled();
    });

    it('enables the org unit groups field and shows options when a project is selected', () => {
        renderWithThemeAndIntlProvider(
            <FormForm
                currentForm={makeForm({ project_ids: makeField([1]) })}
                setFieldValue={vi.fn()}
            />,
        );
        expect(
            screen.getByTestId('input-field-org_unit_group_ids'),
        ).not.toBeDisabled();
        expect(
            screen.getByTestId('options-count-org_unit_group_ids'),
        ).toHaveTextContent('2');
    });

    it('only fetches the groups of the selected projects', () => {
        renderWithThemeAndIntlProvider(
            <FormForm
                currentForm={makeForm({ project_ids: makeField([1, 2]) })}
                setFieldValue={vi.fn()}
            />,
        );
        expect(mockUseGetGroupDropdown).toHaveBeenCalledWith(
            { projectIds: '1,2' },
            true,
        );
    });

    it('displays the selected org unit groups', () => {
        renderWithThemeAndIntlProvider(
            <FormForm
                currentForm={makeForm({
                    project_ids: makeField([1]),
                    org_unit_group_ids: makeField([1, 2]),
                })}
                setFieldValue={vi.fn()}
            />,
        );
        expect(
            screen.getByTestId('input-field-org_unit_group_ids'),
        ).toHaveValue('1,2');
    });

    it('maps the selected org unit groups to an array of ids on change', () => {
        const setFieldValue = vi.fn();
        renderWithThemeAndIntlProvider(
            <FormForm
                currentForm={makeForm({ project_ids: makeField([1]) })}
                setFieldValue={setFieldValue}
            />,
        );
        fireEvent.change(screen.getByTestId('input-field-org_unit_group_ids'), {
            target: { value: '1,2' },
        });
        expect(setFieldValue).toHaveBeenCalledWith(
            'org_unit_group_ids',
            [1, 2],
        );
    });
});

describe('FormFormComponent - show advanced settings', () => {
    it('shows the advanced settings and the tick box "deduced from another form" when user belongs to an account without Dhis2 module', async () => {
        const user = userEvent.setup();
        vi.mocked(userHasAccessToModule).mockReturnValue(true);
        renderWithThemeAndIntlProvider(
            <FormForm currentForm={makeForm()} setFieldValue={vi.fn()} />,
        );
        await user.click(screen.getByText('Show advanced settings'));
        expect(screen.getByText('Hide advanced settings')).toBeInTheDocument();
        expect(screen.getByTestId('input-field-derived')).toHaveValue('false');
    });

    it('hides the checkbox when user belongs to an account without Dhis2 module', async () => {
        const user = userEvent.setup();
        vi.mocked(userHasAccessToModule).mockReturnValue(false);
        renderWithThemeAndIntlProvider(
            <FormForm currentForm={makeForm()} setFieldValue={vi.fn()} />,
        );
        await user.click(screen.getByText('Show advanced settings'));
        expect(
            screen.queryByTestId('input-field-derived'),
        ).not.toBeInTheDocument();
    });
});
