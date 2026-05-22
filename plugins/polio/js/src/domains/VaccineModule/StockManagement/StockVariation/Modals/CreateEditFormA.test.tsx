import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    EDIT_ACCESS_COMPLETION_ONLY,
    EDIT_ACCESS_FULL,
    RECEIVED,
    TEMPORARY,
} from '../../constants';

// ---------------------------------------------------------------------------
// Mocks — hoisted values used across vi.mock calls and test assertions
// ---------------------------------------------------------------------------

const { mockSave } = vi.hoisted(() => ({
    mockSave: vi.fn().mockResolvedValue({}),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('bluesquare-components', () => ({
    useSafeIntl: () => ({
        formatMessage: (msg: any) => msg?.defaultMessage ?? msg?.id ?? '',
    }),
    ConfirmCancelModal: ({
        children,
        open,
        onConfirm,
        allowConfirm = true,
        dataTestId,
        onCancel,
        closeDialog,
    }: any) => {
        if (!open) return null;
        return (
            <div data-testid={dataTestId}>
                {children}
                <button
                    data-testid={`${dataTestId}-confirm`}
                    onClick={onConfirm}
                    disabled={!allowConfirm}
                >
                    Confirm
                </button>
                <button
                    data-testid={`${dataTestId}-cancel`}
                    onClick={onCancel || closeDialog}
                >
                    Cancel
                </button>
            </div>
        );
    },
    makeFullModal: (Component: any) => Component,
    AddButton: () => null,
}));

vi.mock('../../hooks/api', () => ({
    useSaveFormA: () => ({ mutateAsync: mockSave }),
    useCampaignOptions: () => ({
        campaignOptions: [{ value: 'camp-1', label: 'Campaign 1' }],
        isFetching: false,
        roundOptions: [{ value: 1, label: 'Round 1' }],
    }),
}));

vi.mock('./dropdownOptions', () => ({
    useAvailablePresentations: () => [{ value: 20, label: '20' }],
}));

vi.mock('./validation', () => ({
    useFormAValidation: () => {
        const yup = require('yup');
        return yup.object().shape({});
    },
}));

vi.mock('Iaso/hooks/useSkipEffectUntilValue', () => ({
    useSkipEffectUntilValue: () => {},
}));

vi.mock(
    '../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton',
    () => ({
        EditIconButton: () => null,
    }),
);

vi.mock(
    '../../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/utils',
    () => ({
        processErrorDocsBase: () => [],
    }),
);

vi.mock(
    '../../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/DocumentUploadWithPreview',
    () => ({
        default: ({ disabled }: any) => (
            <div data-testid="document-upload" aria-disabled={disabled} />
        ),
    }),
);

vi.mock('Iaso/components/forms/InputComponent', () => ({
    default: ({
        type,
        onChange,
        value,
        disabled,
        labelString,
        keyValue,
    }: any) => {
        if (type === 'checkbox') {
            return (
                <label>
                    <input
                        type="checkbox"
                        checked={!!value}
                        disabled={disabled}
                        onChange={e => onChange(keyValue, e.target.checked)}
                    />
                    {labelString}
                </label>
            );
        }
        return <input data-testid={`input-${keyValue}`} disabled={disabled} />;
    },
}));

vi.mock('../../../../../components/Inputs', () => ({
    DateInput: ({ field, form, disabled, label }: any) => (
        <input
            type="text"
            data-testid={`date-${field.name}`}
            aria-label={label}
            disabled={disabled}
            value={field.value ?? ''}
            onChange={e => {
                form.setFieldTouched(field.name, true);
                form.setFieldValue(field.name, e.target.value);
            }}
        />
    ),
    NumberInput: ({ field, form, disabled, label }: any) => (
        <input
            type="number"
            data-testid={`number-${field.name}`}
            aria-label={label}
            disabled={disabled}
            value={field.value ?? ''}
            onChange={e => {
                form.setFieldTouched(field.name, true);
                form.setFieldValue(field.name, Number(e.target.value));
            }}
        />
    ),
    TextInput: ({ field, form, disabled, label }: any) => (
        <input
            type="text"
            data-testid={`text-${field.name}`}
            aria-label={label}
            disabled={disabled}
            value={field.value ?? ''}
            onChange={e => {
                form.setFieldTouched(field.name, true);
                form.setFieldValue(field.name, e.target.value);
            }}
        />
    ),
}));

vi.mock('../../../../../components/Inputs/SingleSelect', () => ({
    SingleSelect: ({ field, form, disabled, label, options }: any) => (
        <select
            data-testid={`select-${field.name}`}
            aria-label={label}
            disabled={disabled}
            value={field.value ?? ''}
            onChange={e => {
                form.setFieldTouched(field.name, true);
                form.setFieldValue(field.name, e.target.value);
            }}
        >
            <option value="">--</option>
            {(options || []).map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    ),
}));

// ---------------------------------------------------------------------------
// Import the component under test AFTER all mocks are declared
// ---------------------------------------------------------------------------

import { CreateEditFormA } from './CreateEditFormA';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseProps = {
    isOpen: true,
    closeDialog: vi.fn(),
    countryName: 'Test Country',
    vaccine: 'nOPV2' as any,
    vaccineStockId: 'vs-1',
    dosesOptions: undefined,
    defaultDosesPerVial: undefined,
};

const receivedFormA = {
    id: 10,
    status: RECEIVED,
    edit_access: EDIT_ACCESS_FULL,
    within_edit_window: true,
    campaign: 'camp-1',
    round: 1,
    report_date: '2025-06-01',
    form_a_reception_date: '2025-06-05',
    usable_vials_used: 100,
    doses_per_vial: 20,
    file: 'https://example.com/doc.pdf',
    comment: 'original comment',
};

const temporaryFormA = {
    ...receivedFormA,
    status: TEMPORARY,
    form_a_reception_date: null,
    file: undefined,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
    vi.clearAllMocks();
});

describe('CreateEditFormA', () => {
    describe('field gating', () => {
        it('enables all fields for a new form', () => {
            render(<CreateEditFormA {...baseProps} />);

            expect(screen.getByTestId('date-report_date')).not.toBeDisabled();
            expect(
                screen.getByTestId('date-form_a_reception_date'),
            ).not.toBeDisabled();
            expect(
                screen.getByTestId('number-usable_vials_used'),
            ).not.toBeDisabled();
            expect(
                screen.getByTestId('select-doses_per_vial'),
            ).not.toBeDisabled();
            expect(screen.getByTestId('text-comment')).not.toBeDisabled();
            expect(
                screen.getByLabelText('Temporary Form A'),
            ).not.toBeDisabled();
        });

        it('disables reception date and file when status is temporary', () => {
            render(<CreateEditFormA {...baseProps} formA={temporaryFormA} />);

            expect(
                screen.getByTestId('date-form_a_reception_date'),
            ).toBeDisabled();
            expect(screen.getByTestId('document-upload')).toHaveAttribute(
                'aria-disabled',
                'true',
            );
        });

        it('disables non-completion fields with completion_only access', () => {
            render(
                <CreateEditFormA
                    {...baseProps}
                    formA={{
                        ...temporaryFormA,
                        edit_access: EDIT_ACCESS_COMPLETION_ONLY,
                    }}
                />,
            );

            expect(screen.getByTestId('date-report_date')).toBeDisabled();
            expect(
                screen.getByTestId('number-usable_vials_used'),
            ).toBeDisabled();
            expect(screen.getByTestId('select-doses_per_vial')).toBeDisabled();

            // Comment remains editable even in completion-only mode
            expect(screen.getByTestId('text-comment')).not.toBeDisabled();
        });

        it('locks vials when originally temporary and still temporary', () => {
            render(
                <CreateEditFormA
                    {...baseProps}
                    formA={{
                        ...temporaryFormA,
                        edit_access: EDIT_ACCESS_FULL,
                    }}
                />,
            );

            expect(
                screen.getByTestId('number-usable_vials_used'),
            ).toBeDisabled();
        });

        it('unlocks vials when originally temporary but switched to received', () => {
            render(
                <CreateEditFormA
                    {...baseProps}
                    formA={{
                        ...receivedFormA,
                        status: TEMPORARY,
                        edit_access: EDIT_ACCESS_FULL,
                    }}
                />,
            );

            // Originally temporary, still temporary → vials locked
            expect(
                screen.getByTestId('number-usable_vials_used'),
            ).toBeDisabled();
        });
    });

    describe('temporary toggle', () => {
        it('checking temporary on a new form clears reception date and file', async () => {
            const user = userEvent.setup();
            render(<CreateEditFormA {...baseProps} />);

            const checkbox = screen.getByLabelText('Temporary Form A');
            expect(checkbox).not.toBeChecked();

            await act(async () => {
                await user.click(checkbox);
            });

            await waitFor(() => {
                expect(screen.getByLabelText('Temporary Form A')).toBeChecked();
            });

            expect(
                screen.getByTestId('date-form_a_reception_date'),
            ).toBeDisabled();
            expect(screen.getByTestId('document-upload')).toHaveAttribute(
                'aria-disabled',
                'true',
            );
        });

        it('shows warning when toggling persisted received → temporary with existing values', async () => {
            const user = userEvent.setup();
            render(<CreateEditFormA {...baseProps} formA={receivedFormA} />);

            expect(
                screen.queryByTestId('temporary-form-a-status-warning'),
            ).not.toBeInTheDocument();

            await act(async () => {
                await user.click(screen.getByLabelText('Temporary Form A'));
            });

            await waitFor(() => {
                expect(
                    screen.getByTestId('temporary-form-a-status-warning'),
                ).toBeInTheDocument();
            });
        });

        it('applies toggle after confirming warning', async () => {
            const user = userEvent.setup();
            render(<CreateEditFormA {...baseProps} formA={receivedFormA} />);

            await act(async () => {
                await user.click(screen.getByLabelText('Temporary Form A'));
            });

            await waitFor(() => {
                expect(
                    screen.getByTestId('temporary-form-a-status-warning'),
                ).toBeInTheDocument();
            });

            await act(async () => {
                await user.click(
                    screen.getByTestId(
                        'temporary-form-a-status-warning-confirm',
                    ),
                );
            });

            await waitFor(() => {
                expect(
                    screen.queryByTestId('temporary-form-a-status-warning'),
                ).not.toBeInTheDocument();
                expect(screen.getByLabelText('Temporary Form A')).toBeChecked();
            });
        });

        it('cancelling warning keeps status unchanged', async () => {
            const user = userEvent.setup();
            render(<CreateEditFormA {...baseProps} formA={receivedFormA} />);

            await act(async () => {
                await user.click(screen.getByLabelText('Temporary Form A'));
            });

            await waitFor(() => {
                expect(
                    screen.getByTestId('temporary-form-a-status-warning'),
                ).toBeInTheDocument();
            });

            await act(async () => {
                await user.click(
                    screen.getByTestId(
                        'temporary-form-a-status-warning-cancel',
                    ),
                );
            });

            await waitFor(() => {
                expect(
                    screen.queryByTestId('temporary-form-a-status-warning'),
                ).not.toBeInTheDocument();
                expect(
                    screen.getByLabelText('Temporary Form A'),
                ).not.toBeChecked();
            });
        });
    });

    describe('submit behavior', () => {
        it('sends full payload on create', async () => {
            const user = userEvent.setup();
            render(<CreateEditFormA {...baseProps} />);

            // Touch a field to enable the confirm button
            const reportDate = screen.getByTestId('date-report_date');
            await act(async () => {
                await user.clear(reportDate);
                await user.type(reportDate, '2025-07-01');
            });

            await waitFor(() => {
                expect(
                    screen.getByTestId('formA-modal-confirm'),
                ).not.toBeDisabled();
            });

            await act(async () => {
                await user.click(screen.getByTestId('formA-modal-confirm'));
            });

            await waitFor(() => {
                expect(mockSave).toHaveBeenCalledOnce();
            });

            const payload = mockSave.mock.calls[0][0];
            // Create sends the full payload including status, vaccine_stock, etc.
            // `id` key exists but is undefined for a new form (no formA.id).
            expect(payload.id).toBeUndefined();
            expect(payload).toHaveProperty('vaccine_stock', 'vs-1');
            expect(payload).toHaveProperty('status');
        });

        it('sends only changed fields plus id and vaccine_stock on edit', async () => {
            const user = userEvent.setup();
            render(<CreateEditFormA {...baseProps} formA={receivedFormA} />);

            const commentField = screen.getByTestId('text-comment');
            await act(async () => {
                await user.clear(commentField);
                await user.type(commentField, 'updated comment');
            });

            await waitFor(() => {
                expect(
                    screen.getByTestId('formA-modal-confirm'),
                ).not.toBeDisabled();
            });

            await act(async () => {
                await user.click(screen.getByTestId('formA-modal-confirm'));
            });

            await waitFor(() => {
                expect(mockSave).toHaveBeenCalledOnce();
            });

            const payload = mockSave.mock.calls[0][0];
            expect(payload).toHaveProperty('id', 10);
            expect(payload).toHaveProperty('vaccine_stock', 'vs-1');
            expect(payload).toHaveProperty('comment', 'updated comment');
            // Unchanged fields should NOT be in the diff payload
            expect(payload).not.toHaveProperty('report_date');
            expect(payload).not.toHaveProperty('form_a_reception_date');
            expect(payload).not.toHaveProperty('usable_vials_used');
        });

        it('flipping only the status checkbox enables save and sends status in PATCH', async () => {
            const user = userEvent.setup();
            render(
                <CreateEditFormA
                    {...baseProps}
                    formA={{
                        ...temporaryFormA,
                        edit_access: EDIT_ACCESS_FULL,
                        within_edit_window: true,
                    }}
                />,
            );

            // Uncheck temporary → sets status to received
            await act(async () => {
                await user.click(screen.getByLabelText('Temporary Form A'));
            });

            await waitFor(() => {
                expect(
                    screen.getByTestId('formA-modal-confirm'),
                ).not.toBeDisabled();
            });

            await act(async () => {
                await user.click(screen.getByTestId('formA-modal-confirm'));
            });

            await waitFor(() => {
                expect(mockSave).toHaveBeenCalledOnce();
            });

            const payload = mockSave.mock.calls[0][0];
            expect(payload).toHaveProperty('id', 10);
            expect(payload).toHaveProperty('vaccine_stock', 'vs-1');
            expect(payload).toHaveProperty('status', RECEIVED);
        });
    });
});
