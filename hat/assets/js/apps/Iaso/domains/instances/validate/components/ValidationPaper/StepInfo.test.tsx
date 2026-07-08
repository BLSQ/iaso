import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../../tests/helpers';
import { mockWorkflow, mockWorkflowWithStepGap } from '../../testFixtures';
import { StepInfo } from './StepInfo';

const { mockUseParamsObject, mockRedirectToReplace } = vi.hoisted(() => ({
    mockUseParamsObject: vi.fn(),
    mockRedirectToReplace: vi.fn(),
}));

vi.mock('Iaso/routing/hooks/useParamsObject', () => ({
    useParamsObject: mockUseParamsObject,
}));

vi.mock('Iaso/components/forms/InputComponent', () => ({
    default: ({
        keyValue,
        onChange,
        value,
        options = [],
        labelString,
        loading,
    }: {
        keyValue: string;
        onChange: (k: string, v: string) => void;
        value?: string;
        options?: { label: string; value: string }[];
        labelString?: string;
        loading?: boolean;
    }) => (
        <label htmlFor={`input-${keyValue}`}>
            {labelString}
            <select
                id={`input-${keyValue}`}
                data-testid={`input-${keyValue}`}
                disabled={loading}
                value={value ?? ''}
                onChange={event => onChange(keyValue, event.target.value)}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    ),
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string; id?: string }) =>
                msg.defaultMessage ?? msg.id ?? '',
        }),
        useRedirectToReplace: () => mockRedirectToReplace,
        textPlaceholder: '-',
    };
});

describe('StepInfo', () => {
    const baseParams = {
        accountId: '1',
        instanceId: '42',
        selectedStep: '1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseParamsObject.mockReturnValue(baseParams);
    });

    it('renders form name', () => {
        renderWithThemeAndIntlProvider(
            <StepInfo
                formName="Test Form"
                workflow={mockWorkflow}
                isLoading={false}
            />,
        );

        expect(screen.getByText('Test Form')).toBeInTheDocument();
    });

    it('renders only active steps in the dropdown', () => {
        renderWithThemeAndIntlProvider(
            <StepInfo
                formName="Test Form"
                workflow={mockWorkflow}
                isLoading={false}
            />,
        );

        const select = screen.getByTestId('input-selectedStep');
        const options = select.querySelectorAll('option');
        expect(options).toHaveLength(2);
        expect(options[0]).toHaveTextContent('Step B');
        expect(options[1]).toHaveTextContent('Step A');
    });

    it('shows placeholder when expected next step is selected', () => {
        renderWithThemeAndIntlProvider(
            <StepInfo
                formName="Test Form"
                workflow={mockWorkflow}
                isLoading={false}
            />,
        );

        const bypassedRow = screen.getByText('Bypassed steps').parentElement;
        expect(bypassedRow).toHaveTextContent('-');
    });

    it('shows earlier active steps as bypassed when a later step is selected', () => {
        mockUseParamsObject.mockReturnValue({
            ...baseParams,
            selectedStep: '2',
        });

        renderWithThemeAndIntlProvider(
            <StepInfo
                formName="Test Form"
                workflow={mockWorkflow}
                isLoading={false}
            />,
        );

        const bypassedRow = screen.getByText('Bypassed steps').parentElement;
        expect(bypassedRow).toHaveTextContent('Step A');
    });

    it('shows placeholder for bypassed steps when selectedStep is invalid', () => {
        mockUseParamsObject.mockReturnValue({
            ...baseParams,
            selectedStep: '999',
        });

        renderWithThemeAndIntlProvider(
            <StepInfo
                formName="Test Form"
                workflow={mockWorkflow}
                isLoading={false}
            />,
        );

        const bypassedRow = screen.getByText('Bypassed steps').parentElement;
        expect(bypassedRow).toHaveTextContent('-');
    });

    it('uses active step order when timeline has skipped steps between actives', () => {
        mockUseParamsObject.mockReturnValue({
            ...baseParams,
            selectedStep: '5',
        });

        renderWithThemeAndIntlProvider(
            <StepInfo
                formName="Test Form"
                workflow={mockWorkflowWithStepGap}
                isLoading={false}
            />,
        );

        const select = screen.getByTestId('input-selectedStep');
        const options = select.querySelectorAll('option');
        expect(options).toHaveLength(2);
        expect(options[0]).toHaveTextContent('Step E');
        expect(options[1]).toHaveTextContent('Step A');

        const bypassedRow = screen.getByText('Bypassed steps').parentElement;
        expect(bypassedRow).toHaveTextContent('Step A');
        expect(bypassedRow).not.toHaveTextContent('Step B');
    });

    it('calls redirectToReplace when step changes', async () => {
        const user = userEvent.setup();

        renderWithThemeAndIntlProvider(
            <StepInfo
                formName="Test Form"
                workflow={mockWorkflow}
                isLoading={false}
            />,
        );

        await user.selectOptions(screen.getByTestId('input-selectedStep'), '2');

        expect(mockRedirectToReplace).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ selectedStep: '2' }),
        );
    });
});
