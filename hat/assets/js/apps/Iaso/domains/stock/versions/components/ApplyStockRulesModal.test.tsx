import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
    'Iaso/api/applyStockRules/endpoints/apply-stock-rules/apply-stock-rules',
    () => ({
        useApiTasksCreateApplystockrulesCreate: vi.fn(),
    }),
);

vi.mock('Iaso/domains/stock/hooks/useGetSkusDropdownOptions', () => ({
    useGetSkusDropdownOptions: vi.fn(),
}));

// DatesRange uses MUI DatePicker which requires a LocalizationProvider; expose simple inputs in jsdom.
vi.mock('Iaso/components/filters/DatesRange', () => ({
    default: ({
        dateFrom,
        dateTo,
        keyDateFrom,
        keyDateTo,
        onChangeDate,
        errors,
    }: {
        dateFrom?: string;
        dateTo?: string;
        keyDateFrom: string;
        keyDateTo: string;
        onChangeDate: (key: string, value?: string) => void;
        errors?: [string[], string[]];
    }) => (
        <div>
            <input
                aria-label="Start date"
                data-testid="start-date-input"
                value={dateFrom ?? ''}
                onChange={e =>
                    onChangeDate(keyDateFrom, e.target.value || undefined)
                }
            />
            <input
                aria-label="End date"
                data-testid="end-date-input"
                value={dateTo ?? ''}
                onChange={e =>
                    onChangeDate(keyDateTo, e.target.value || undefined)
                }
            />
            {errors?.[1]?.map(err => (
                <span key={err} role="alert">
                    {err}
                </span>
            ))}
        </div>
    ),
}));

vi.mock('Iaso/components/forms/InputComponent', () => ({
    default: ({
        keyValue,
        value,
        onChange,
        options = [],
    }: {
        keyValue: string;
        value?: number;
        onChange: (key: string, value: number | undefined) => void;
        options?: Array<{ value: number; label: string }>;
    }) => (
        <select
            aria-label="Stock Keeping Unit"
            data-testid="sku-select"
            value={value ?? ''}
            onChange={e =>
                onChange(
                    keyValue,
                    e.target.value ? Number(e.target.value) : undefined,
                )
            }
        >
            <option value="">Select SKU</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    ),
}));

import { useApiTasksCreateApplystockrulesCreate } from 'Iaso/api/applyStockRules/endpoints/apply-stock-rules/apply-stock-rules';
import { ApplyStockRulesRequest } from 'Iaso/api/applyStockRules/models/applyStockRulesRequest.zod';
import { ApplyStockRulesResponse } from 'Iaso/api/applyStockRules/models/applyStockRulesResponse.zod';
import { useGetSkusDropdownOptions } from 'Iaso/domains/stock/hooks/useGetSkusDropdownOptions';
import MESSAGES from 'Iaso/domains/stock/messages';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { ApplyStockRulesModal } from './ApplyStockRulesModal';

const launchMutation = vi.fn();

describe('ApplyStockRulesModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useApiTasksCreateApplystockrulesCreate).mockReturnValue({
            mutate: launchMutation,
            isLoading: false,
        } as any);
        vi.mocked(useGetSkusDropdownOptions).mockReturnValue({
            data: [
                { value: 42, label: 'Paracetamol' },
                { value: 99, label: 'Amoxicillin' },
            ],
            isFetching: false,
        } as any);
    });

    it('disables the trigger button when rules are not published', () => {
        renderWithThemeAndIntlProvider(
            <ApplyStockRulesModal iconProps={{ disabled: true }} />,
        );
        const button = screen.getByTestId('apply-stock-rules-button');
        expect(button).toBeDisabled();
    });

    it('enables the trigger button when rules are published and requires a SKU before confirming', () => {
        renderWithThemeAndIntlProvider(
            <ApplyStockRulesModal iconProps={{ disabled: false }} />,
        );
        const button = screen.getByTestId('apply-stock-rules-button');
        expect(button).toBeEnabled();

        fireEvent.click(button);

        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        expect(confirmButton).toBeDisabled();
        expect(useApiTasksCreateApplystockrulesCreate).toHaveBeenCalledWith({
            mutation: expect.objectContaining({
                meta: {
                    snackSuccessMessage: MESSAGES.taskLaunched,
                    useApiErrorMessage: true,
                },
            }),
        });
    });

    it('launches the task with only sku_id when dates are omitted', async () => {
        launchMutation.mockImplementation((_variables, options) => {
            options?.onSuccess?.();
        });

        renderWithThemeAndIntlProvider(
            <ApplyStockRulesModal iconProps={{ disabled: false }} />,
        );

        fireEvent.click(screen.getByTestId('apply-stock-rules-button'));
        fireEvent.change(screen.getByTestId('sku-select'), {
            target: { value: '42' },
        });

        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        await waitFor(() => expect(confirmButton).toBeEnabled());

        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(launchMutation).toHaveBeenCalledWith(
                { data: { sku_id: 42 } },
                expect.objectContaining({ onSuccess: expect.any(Function) }),
            );
        });
    });

    it('converts optional start and end dates to YYYY-MM-DD when provided', async () => {
        renderWithThemeAndIntlProvider(
            <ApplyStockRulesModal iconProps={{ disabled: false }} />,
        );

        fireEvent.click(screen.getByTestId('apply-stock-rules-button'));
        fireEvent.change(screen.getByTestId('sku-select'), {
            target: { value: '42' },
        });
        fireEvent.change(screen.getByTestId('start-date-input'), {
            target: { value: '10-01-2025' },
        });
        fireEvent.change(screen.getByTestId('end-date-input'), {
            target: { value: '20-01-2025' },
        });

        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        await waitFor(() => expect(confirmButton).toBeEnabled());

        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(launchMutation).toHaveBeenCalledWith(
                {
                    data: {
                        sku_id: 42,
                        start_date: '2025-01-10',
                        end_date: '2025-01-20',
                    },
                },
                expect.objectContaining({ onSuccess: expect.any(Function) }),
            );
        });
    });

    it('launches the task with only start_date when end_date is omitted', async () => {
        renderWithThemeAndIntlProvider(
            <ApplyStockRulesModal iconProps={{ disabled: false }} />,
        );

        fireEvent.click(screen.getByTestId('apply-stock-rules-button'));
        fireEvent.change(screen.getByTestId('sku-select'), {
            target: { value: '99' },
        });
        fireEvent.change(screen.getByTestId('start-date-input'), {
            target: { value: '15-03-2025' },
        });

        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        await waitFor(() => expect(confirmButton).toBeEnabled());

        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(launchMutation).toHaveBeenCalledWith(
                {
                    data: {
                        sku_id: 99,
                        start_date: '2025-03-15',
                    },
                },
                expect.objectContaining({ onSuccess: expect.any(Function) }),
            );
        });
    });

    it('prevents submission when end date is before start date', async () => {
        renderWithThemeAndIntlProvider(
            <ApplyStockRulesModal iconProps={{ disabled: false }} />,
        );

        fireEvent.click(screen.getByTestId('apply-stock-rules-button'));
        fireEvent.change(screen.getByTestId('sku-select'), {
            target: { value: '42' },
        });
        fireEvent.change(screen.getByTestId('start-date-input'), {
            target: { value: '20-01-2025' },
        });
        fireEvent.change(screen.getByTestId('end-date-input'), {
            target: { value: '10-01-2025' },
        });

        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        await waitFor(() => expect(confirmButton).toBeDisabled());
        expect(launchMutation).not.toHaveBeenCalled();
    });

    it('validates request and queued task response payloads with generated Orval Zod schemas', () => {
        expect(ApplyStockRulesRequest.parse({ sku_id: 42 })).toEqual({
            sku_id: 42,
        });
        expect(
            ApplyStockRulesRequest.parse({
                sku_id: 42,
                start_date: '2025-01-10',
                end_date: '2025-01-20',
            }),
        ).toEqual({
            sku_id: 42,
            start_date: '2025-01-10',
            end_date: '2025-01-20',
        });

        const backendResponse = {
            task: {
                id: 1,
                created_at: 1736467200.0,
                started_at: null,
                ended_at: null,
                progress_value: 0,
                end_value: 0,
                created_by: {
                    id: 7,
                    first_name: 'Jane',
                    last_name: 'Doe',
                    username: 'jdoe',
                    full_name: 'Jane Doe',
                },
                launcher: {
                    id: 7,
                    first_name: 'Jane',
                    last_name: 'Doe',
                    username: 'jdoe',
                    full_name: 'Jane Doe',
                },
                result: null,
                status: 'QUEUED' as const,
                name: 'apply_stock_rules',
                should_be_killed: false,
                progress_message: null,
                external: false,
                heartbeat_at: null,
            },
        };
        expect(ApplyStockRulesResponse.parse(backendResponse)).toEqual(
            backendResponse,
        );
    });
});
