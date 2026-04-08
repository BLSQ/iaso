import React from 'react';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { renderWithTheme } from '../../../../../tests/helpers';

import {
    NO_PERIOD,
    PERIOD_TYPE_DAY,
    PERIOD_TYPE_FINANCIAL_NOV,
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_PLACEHOLDER,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_WEEK,
    PERIOD_TYPE_YEAR,
} from '../constants';
import PeriodPicker from './PeriodPicker';

const pickerOptionsFixture = {
    semesterOptions: [{ label: 'First semester', value: 1 }],
    quarterOptions: [{ label: 'Q1', value: 1 }],
    monthOptions: [
        { label: 'March', value: 3 },
        { label: 'April', value: 4 },
    ],
    yearOptions: [
        { label: '2023', value: '2023' },
        { label: '2024', value: '2024' },
    ],
    weekOptions: [{ label: 'Week 1', value: 1 }],
};

vi.mock('Iaso/domains/periods/options', () => ({
    usePeriodPickerOptions: () => pickerOptionsFixture,
}));

vi.mock('bluesquare-components', async () => {
    const mod = await vi.importActual<typeof import('bluesquare-components')>(
        'bluesquare-components',
    );
    return {
        ...mod,
        DatePicker: ({
            onChange,
            label,
        }: {
            onChange: (date: { format: (f: string) => string } | null) => void;
            label: string;
        }) => (
            <button
                type="button"
                data-testid="period-day-picker-trigger"
                onClick={() =>
                    onChange({
                        format: (fmt: string) =>
                            fmt === 'YYYYMMDD' ? '20240615' : '',
                    })
                }
            >
                {label}
            </button>
        ),
    };
});

vi.mock('Iaso/components/forms/InputComponent', () => ({
    default: ({
        keyValue,
        onChange,
        value,
        options = [],
        label,
        disabled,
    }: {
        keyValue: string;
        onChange: (k: string, v: string | number) => void;
        value?: string | number | null;
        options?: { label: string; value: string | number }[];
        label?: { defaultMessage?: string };
        disabled?: boolean;
    }) => (
        <div data-testid={`period-input-${keyValue}`}>
            <span data-testid={`period-label-${keyValue}`}>
                {label?.defaultMessage ?? keyValue}
            </span>
            <select
                data-testid={`period-select-${keyValue}`}
                disabled={Boolean(disabled)}
                value={
                    value === null || value === undefined ? '' : String(value)
                }
                onChange={event => {
                    const raw = event.target.value;
                    if (raw === '') {
                        onChange(keyValue, '');
                        return;
                    }
                    const asNum = Number(raw);
                    onChange(
                        keyValue,
                        Number.isNaN(asNum) || raw === '' ? raw : asNum,
                    );
                }}
            >
                <option value="">--</option>
                {options.map(opt => (
                    <option key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    ),
}));

const renderPeriodPicker = (ui: React.ReactElement) =>
    renderWithTheme(
        <IntlProvider locale="en" messages={{}}>
            {ui}
        </IntlProvider>,
    );

describe('PeriodPicker', () => {
    it('renders nothing when periodType is falsy', () => {
        const onChange = vi.fn();
        const { container } = renderPeriodPicker(
            <PeriodPicker periodType="" title="Period" onChange={onChange} />,
        );
        expect(container.firstChild).toBeNull();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('shows placeholder message for EMPTY period type', () => {
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_PLACEHOLDER}
                title="Start"
                onChange={vi.fn()}
                message="Choose a period granularity"
            />,
        );
        expect(
            screen.getByText('Choose a period granularity'),
        ).toBeInTheDocument();
    });

    it('shows placeholder message for NO_PERIOD type', () => {
        renderPeriodPicker(
            <PeriodPicker
                periodType={NO_PERIOD}
                title="End"
                onChange={vi.fn()}
                message="No period"
            />,
        );
        expect(screen.getByText('No period')).toBeInTheDocument();
    });

    it('syncs activePeriodString on mount and calls onChange for month periods', () => {
        const onChange = vi.fn();
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_MONTH}
                title="Month period"
                onChange={onChange}
                activePeriodString="202403"
            />,
        );
        expect(onChange).toHaveBeenCalledWith('202403');
        expect(screen.getByTestId('period-select-year')).toHaveValue('2024');
        expect(screen.getByTestId('period-select-month')).toHaveValue('3');
    });

    it('updates year selection and clears when year is cleared', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_YEAR}
                title="Year"
                onChange={onChange}
            />,
        );

        await user.selectOptions(
            screen.getByTestId('period-select-year'),
            '2024',
        );
        expect(onChange).toHaveBeenLastCalledWith('2024');

        await user.selectOptions(screen.getByTestId('period-select-year'), '');
        expect(onChange).toHaveBeenLastCalledWith('');
    });

    it('builds month period string after year then month', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_MONTH}
                title="Month"
                onChange={onChange}
            />,
        );

        await user.selectOptions(
            screen.getByTestId('period-select-year'),
            '2024',
        );
        expect(onChange).toHaveBeenLastCalledWith('2024');

        await user.selectOptions(
            screen.getByTestId('period-select-month'),
            '3',
        );
        expect(onChange).toHaveBeenLastCalledWith('202403');
    });

    it('builds quarter period string', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_QUARTER}
                title="Quarter"
                onChange={onChange}
            />,
        );

        await user.selectOptions(
            screen.getByTestId('period-select-year'),
            '2024',
        );
        await user.selectOptions(
            screen.getByTestId('period-select-quarter'),
            '1',
        );
        expect(onChange).toHaveBeenLastCalledWith('2024Q1');
    });

    it('builds semester period string', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_SIX_MONTH}
                title="Semester"
                onChange={onChange}
            />,
        );

        await user.selectOptions(
            screen.getByTestId('period-select-year'),
            '2024',
        );
        await user.selectOptions(
            screen.getByTestId('period-select-semester'),
            '1',
        );
        expect(onChange).toHaveBeenLastCalledWith('2024S1');
    });

    it('builds financial November year string', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_FINANCIAL_NOV}
                title="Financial"
                onChange={onChange}
            />,
        );

        await user.selectOptions(
            screen.getByTestId('period-select-year'),
            '2024',
        );
        expect(onChange).toHaveBeenLastCalledWith('2024Nov');
    });

    it('builds week period string after year and week', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_WEEK}
                title="Week"
                onChange={onChange}
            />,
        );

        await user.selectOptions(
            screen.getByTestId('period-select-year'),
            '2024',
        );
        await user.selectOptions(screen.getByTestId('period-select-week'), '1');
        expect(onChange).toHaveBeenLastCalledWith('2024W1');
    });

    it('emits YYYYMMDD from day picker', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_DAY}
                title="Day range"
                onChange={onChange}
            />,
        );

        await user.click(screen.getByTestId('period-day-picker-trigger'));
        expect(onChange).toHaveBeenCalledWith('20240615');
    });

    it('disables month select until a year is chosen', () => {
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_MONTH}
                title="Month"
                onChange={vi.fn()}
            />,
        );
        expect(screen.getByTestId('period-select-month')).toBeDisabled();
    });

    it('uses default keyName id on root box', () => {
        renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_YEAR}
                title="Year"
                onChange={vi.fn()}
            />,
        );
        const root = screen.getByTestId('period-select-year').closest('[id]');
        expect(root).toHaveAttribute('id', 'period');
    });

    it('renders error helper text when hasError or errors are set', () => {
        const { rerender } = renderPeriodPicker(
            <PeriodPicker
                periodType={PERIOD_TYPE_YEAR}
                title="Year"
                onChange={vi.fn()}
                hasError
                errors={['Invalid']}
            />,
        );
        expect(screen.getByText('Invalid')).toBeInTheDocument();

        rerender(
            <IntlProvider locale="en" messages={{}}>
                <PeriodPicker
                    periodType={PERIOD_TYPE_YEAR}
                    title="Year"
                    onChange={vi.fn()}
                    errors={['Required']}
                />
            </IntlProvider>,
        );
        expect(screen.getByText('Required')).toBeInTheDocument();
    });
});
