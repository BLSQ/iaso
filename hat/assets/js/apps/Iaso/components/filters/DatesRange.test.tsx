import React, { act, useEffect, useRef } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';
import DatesRange from './DatesRange';

type MockDate = {
    isValid?: () => boolean;
    format: (f: string) => string;
};

const pickerPropsByTestId: Record<string, any> = {};
const nextDateByTestId: Record<string, MockDate | null> = {};

vi.mock('../../utils/dates', () => ({
    dateFormat: 'DD-MM-YYYY',
    getLocaleDateFormat: () => 'DD/MM/YYYY',
    getUrlParamDateObject: (value: string) => `parsed:${value}`,
}));

vi.mock('@mui/x-date-pickers/DesktopDatePicker', () => ({
    DesktopDatePicker: (props: Record<string, any>) => {
        const testId =
            props?.slotProps?.textField?.InputProps?.['data-test'] ??
            'date-picker';
        pickerPropsByTestId[testId] = props;
        return (
            <button
                type="button"
                data-testid={testId}
                onClick={() => props.onChange(nextDateByTestId[testId] ?? null)}
            >
                {props.label}
            </button>
        );
    },
}));

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual<
        typeof import('bluesquare-components')
    >('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string } | string) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? ''),
        }),
        useSkipEffectOnMount: (
            effect: () => void,
            deps: React.DependencyList,
        ) => {
            const mounted = useRef(false);
            useEffect(() => {
                if (mounted.current) {
                    effect();
                    return;
                }
                mounted.current = true;
            }, deps);
        },
        FormControl: ({
            children,
            errors,
        }: {
            children: React.ReactNode;
            errors: unknown[];
        }) => <div data-errors-length={errors.length}>{children}</div>,
        IconButton: ({
            onClick,
            icon,
        }: {
            onClick: () => void;
            icon: string;
        }) => (
            <button
                type="button"
                data-testid={`${icon}-icon-button`}
                onClick={onClick}
            />
        ),
    };
});

const setNextDate = (testId: string, date: MockDate | null) => {
    nextDateByTestId[testId] = date;
};

describe('DatesRange', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(pickerPropsByTestId).forEach(key => {
            delete pickerPropsByTestId[key];
        });
        Object.keys(nextDateByTestId).forEach(key => {
            delete nextDateByTestId[key];
        });
    });

    it('formats and emits valid from/to dates with default keys', async () => {
        const user = userEvent.setup();
        const onChangeDate = vi.fn();
        setNextDate('start-date', {
            isValid: () => true,
            format: () => '10-04-2026',
        });
        setNextDate('end-date', {
            isValid: () => true,
            format: () => '30-04-2026',
        });

        renderWithThemeAndIntlProvider(
            <DatesRange onChangeDate={onChangeDate} />,
        );

        await act(async () => {
            await user.click(screen.getByTestId('start-date'));
        });
        await act(async () => {
            await user.click(screen.getByTestId('end-date'));
        });

        expect(onChangeDate).toHaveBeenNthCalledWith(
            1,
            'dateFrom',
            '10-04-2026',
        );
        expect(onChangeDate).toHaveBeenNthCalledWith(2, 'dateTo', '30-04-2026');
    });

    it('emits undefined for invalid date when blockInvalidDates is true', async () => {
        const user = userEvent.setup();
        const onChangeDate = vi.fn();
        setNextDate('start-date', {
            isValid: () => false,
            format: () => 'ignored',
        });

        renderWithThemeAndIntlProvider(
            <DatesRange onChangeDate={onChangeDate} />,
        );

        await act(async () => {
            await user.click(screen.getByTestId('start-date'));
        });
        expect(onChangeDate).toHaveBeenCalledWith('dateFrom', undefined);
    });

    it('emits formatted date when blockInvalidDates is false', async () => {
        const user = userEvent.setup();
        const onChangeDate = vi.fn();
        setNextDate('start-date', {
            isValid: () => false,
            format: () => 'forced-value',
        });

        renderWithThemeAndIntlProvider(
            <DatesRange
                onChangeDate={onChangeDate}
                blockInvalidDates={false}
            />,
        );

        await act(async () => {
            await user.click(screen.getByTestId('start-date'));
        });
        expect(onChangeDate).toHaveBeenCalledWith('dateFrom', 'forced-value');
    });

    it('clears from and to using provided key names', async () => {
        const user = userEvent.setup();
        const onChangeDate = vi.fn();

        renderWithThemeAndIntlProvider(
            <DatesRange
                onChangeDate={onChangeDate}
                dateFrom="01-04-2026"
                dateTo="30-04-2026"
                keyDateFrom="created_at_after"
                keyDateTo="created_at_before"
            />,
        );

        const clearButtons = screen.getAllByTestId('clear-icon-button');
        await act(async () => {
            await user.click(clearButtons[0]);
        });
        await act(async () => {
            await user.click(clearButtons[1]);
        });

        expect(onChangeDate).toHaveBeenNthCalledWith(
            1,
            'created_at_after',
            undefined,
        );
        expect(onChangeDate).toHaveBeenNthCalledWith(
            2,
            'created_at_before',
            undefined,
        );
    });

    it('hides clear buttons when disabled', () => {
        renderWithThemeAndIntlProvider(
            <DatesRange dateFrom="01-04-2026" dateTo="30-04-2026" disabled />,
        );
        expect(
            screen.queryByTestId('clear-icon-button'),
        ).not.toBeInTheDocument();
    });

    it('passes min/max constraints and required/error flags to date pickers', () => {
        renderWithThemeAndIntlProvider(
            <DatesRange
                dateFrom="01-04-2026"
                dateTo="30-04-2026"
                dateFromRequired
                dateToRequired
                errors={[['fromError'], ['toError']]}
            />,
        );

        expect(pickerPropsByTestId['start-date'].maxDate).toEqual(
            'parsed:30-04-2026',
        );
        expect(pickerPropsByTestId['end-date'].minDate).toEqual(
            'parsed:01-04-2026',
        );
        expect(
            pickerPropsByTestId['start-date'].slotProps.textField.required,
        ).toBe(true);
        expect(
            pickerPropsByTestId['end-date'].slotProps.textField.required,
        ).toBe(true);
        expect(
            pickerPropsByTestId['start-date'].slotProps.textField.error,
        ).toBe(true);
        expect(pickerPropsByTestId['end-date'].slotProps.textField.error).toBe(
            true,
        );
    });

    it('syncs picker values when dateFrom/dateTo props change after mount', () => {
        const { rerender } = renderWithThemeAndIntlProvider(
            <DatesRange dateFrom="01-04-2026" dateTo="10-04-2026" />,
        );

        expect(pickerPropsByTestId['start-date'].value).toEqual(
            'parsed:01-04-2026',
        );
        expect(pickerPropsByTestId['end-date'].value).toEqual(
            'parsed:10-04-2026',
        );

        rerender(
            <DatesRange
                dateFrom="05-04-2026"
                dateTo="20-04-2026"
                onChangeDate={vi.fn()}
            />,
        );

        expect(pickerPropsByTestId['start-date'].value).toEqual(
            'parsed:05-04-2026',
        );
        expect(pickerPropsByTestId['end-date'].value).toEqual(
            'parsed:20-04-2026',
        );
    });
});
