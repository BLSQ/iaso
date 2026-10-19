import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import * as useGetGroupsModule from '../../orgUnits/hooks/requests/useGetGroups';
import { NO_PERIOD, PERIOD_TYPE_MONTH } from '../../periods/constants';
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
        errors,
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
            <span data-testid={`errors-${keyValue}`}>
                {errors ? errors.join(',') : ''}
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
    promptness_grace_period_days: makeField(null),
    device_field: makeField('deviceid'),
    location_field: makeField(''),
    possible_fields: makeField([]),
    label_keys: makeField([]),
    legend_threshold: makeField(null),
    change_request_mode: makeField('CR_MODE_NONE'),
    validation_workflow: makeField(null),
    ...overrides,
});

// fireEvent (instead of userEvent) keeps the click wrapped in act():
// user-event ships its own @testing-library/dom copy, not configured by RTL
const showAdvancedSettings = () =>
    fireEvent.click(screen.getByText('Show advanced settings'));

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
    it('shows the advanced settings and the tick box "deduced from another form" when user belongs to an account without Dhis2 module', () => {
        vi.mocked(userHasAccessToModule).mockReturnValue(true);
        renderWithThemeAndIntlProvider(
            <FormForm currentForm={makeForm()} setFieldValue={vi.fn()} />,
        );
        showAdvancedSettings();
        expect(screen.getByText('Hide advanced settings')).toBeInTheDocument();
        expect(screen.getByTestId('input-field-derived')).toHaveValue('false');
    });

    it('hides the checkbox when user belongs to an account without Dhis2 module', () => {
        vi.mocked(userHasAccessToModule).mockReturnValue(false);
        renderWithThemeAndIntlProvider(
            <FormForm currentForm={makeForm()} setFieldValue={vi.fn()} />,
        );
        showAdvancedSettings();
        expect(
            screen.queryByTestId('input-field-derived'),
        ).not.toBeInTheDocument();
    });
});

describe('FormFormComponent - promptness grace period days', () => {
    const renderForm = (
        overrides: Record<string, any> = {},
        setFieldValue = vi.fn(),
    ) =>
        renderWithThemeAndIntlProvider(
            <FormForm
                currentForm={makeForm({
                    period_type: makeField(PERIOD_TYPE_MONTH),
                    ...overrides,
                })}
                setFieldValue={setFieldValue}
            />,
        );

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetGroupDropdown.mockReturnValue({
            data: [],
            isFetching: false,
        });
    });

    it('is displayed under the period type, without the advanced settings', () => {
        renderForm();
        expect(
            screen.getByTestId('input-promptness_grace_period_days'),
        ).toBeInTheDocument();
    });

    it('is hidden when the form has no period type', () => {
        renderForm({ period_type: makeField(null) });
        expect(
            screen.queryByTestId('input-promptness_grace_period_days'),
        ).not.toBeInTheDocument();
    });

    it('displays the current value', () => {
        renderForm({ promptness_grace_period_days: makeField(5) });
        expect(
            screen.getByTestId('input-field-promptness_grace_period_days'),
        ).toHaveValue('5');
    });

    it('calls setFieldValue with the new value on change', () => {
        const setFieldValue = vi.fn();
        renderForm({}, setFieldValue);
        fireEvent.change(
            screen.getByTestId('input-field-promptness_grace_period_days'),
            { target: { value: '3' } },
        );
        expect(setFieldValue).toHaveBeenCalledWith(
            'promptness_grace_period_days',
            '3',
        );
    });

    it('sets the value to null when the input is cleared', () => {
        const setFieldValue = vi.fn();
        renderForm(
            { promptness_grace_period_days: makeField(5) },
            setFieldValue,
        );
        fireEvent.change(
            screen.getByTestId('input-field-promptness_grace_period_days'),
            { target: { value: '' } },
        );
        expect(setFieldValue).toHaveBeenCalledWith(
            'promptness_grace_period_days',
            null,
        );
    });

    it('resets the value to null when the period type is removed', () => {
        const setFieldValue = vi.fn();
        renderForm(
            { promptness_grace_period_days: makeField(5) },
            setFieldValue,
        );
        fireEvent.change(screen.getByTestId('input-field-period_type'), {
            target: { value: NO_PERIOD },
        });
        expect(setFieldValue).toHaveBeenCalledWith(
            'promptness_grace_period_days',
            null,
        );
        expect(setFieldValue).toHaveBeenCalledWith('period_type', null);
    });

    it('displays the errors returned by the backend', () => {
        const backendError = 'Ensure this value is greater than or equal to 0.';
        renderForm({
            promptness_grace_period_days: {
                value: -1,
                errors: [backendError],
            },
        });
        expect(
            screen.getByTestId('errors-promptness_grace_period_days'),
        ).toHaveTextContent(backendError);
    });
});
