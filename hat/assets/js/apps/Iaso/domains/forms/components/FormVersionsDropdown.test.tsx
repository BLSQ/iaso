import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FormVersionsDropdown } from './FormVersionsDropdown';

const mockUseGetFormVersionsDropdownOptions = vi.fn();

vi.mock('Iaso/domains/forms/hooks/useGetFormVersionsDropdownOptions', () => ({
    useGetFormVersionsDropdownOptions: (formIds?: string) =>
        mockUseGetFormVersionsDropdownOptions(formIds),
}));

vi.mock('bluesquare-components', () => ({
    useSafeIntl: () => ({
        formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
            defaultMessage,
    }),
}));

const sampleOptions = [
    {
        label: 'V1 - Form A',
        value: '10',
        formName: 'Form A',
        versionId: '1',
        formId: 1,
    },
    {
        label: 'V2 - Form A',
        value: '11',
        formName: 'Form A',
        versionId: '2',
        formId: 1,
    },
    {
        label: 'V1 - Form B',
        value: '20',
        formName: 'Form B',
        versionId: '1',
        formId: 2,
    },
];

describe('FormVersionsDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetFormVersionsDropdownOptions.mockReturnValue({
            data: sampleOptions,
            isFetching: false,
        });
    });

    it('renders disabled when no formIds are provided', () => {
        render(
            <FormVersionsDropdown formIds="" value={null} onChange={vi.fn()} />,
        );

        const input = screen.getByRole('combobox');
        expect(input).toBeDisabled();
    });

    it('renders enabled and displays selected options when formIds and value are provided', () => {
        render(
            <FormVersionsDropdown formIds="1" value="10" onChange={vi.fn()} />,
        );

        const input = screen.getByRole('combobox');
        expect(input).not.toBeDisabled();
        expect(screen.getByText('V1 - Form A')).toBeInTheDocument();
    });

    it('calls onChange when user selects an option', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <FormVersionsDropdown
                formIds="1"
                value={null}
                onChange={onChange}
            />,
        );

        const input = screen.getByRole('combobox');
        await user.click(input);

        const option = await screen.findByRole('option', {
            name: 'V1 - Form A',
        });
        await user.click(option);

        expect(onChange).toHaveBeenCalledWith('10');
    });

    it('calls onChange(null) when formIds is removed while a value was selected', () => {
        const onChange = vi.fn();

        const { rerender } = render(
            <FormVersionsDropdown formIds="1" value="10" onChange={onChange} />,
        );

        rerender(
            <FormVersionsDropdown formIds="" value="10" onChange={onChange} />,
        );

        expect(onChange).toHaveBeenCalledWith(null);
    });

    it('prunes version when its parent form is unselected', () => {
        const onChange = vi.fn();

        const { rerender } = render(
            <FormVersionsDropdown
                formIds="1,2"
                value="10,20"
                onChange={onChange}
            />,
        );

        // Form 1 removed, only Form 2 remains -> 10 should be pruned, 20 kept
        rerender(
            <FormVersionsDropdown
                formIds="2"
                value="10,20"
                onChange={onChange}
            />,
        );

        expect(onChange).toHaveBeenCalledWith('20');
    });
});
