import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { PlanningsDropdown } from './PlanningsDropdown';

const { mockCurrentUser } = vi.hoisted(() => ({
    mockCurrentUser: vi.fn(),
}));

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: mockCurrentUser,
}));

const { mockUseGetPlanningsOptions } = vi.hoisted(() => ({
    mockUseGetPlanningsOptions: vi.fn(),
}));

vi.mock('Iaso/domains/plannings/hooks/requests/useGetPlannings', () => ({
    useGetPlanningsOptions: mockUseGetPlanningsOptions,
}));

const userWithPlanningRead = {
    id: 1,
    permissions: ['iaso_planning_read'],
};

const planningOptions = [
    { value: 1, label: 'Planning Alpha' },
    { value: 2, label: 'Planning Beta' },
];

const Wrapper = ({
    formIds,
    multi,
}: {
    formIds?: string;
    multi?: boolean;
} = {}) => {
    const [value, setValue] = React.useState<number | null>(null);
    return (
        <PlanningsDropdown
            formIds={formIds}
            multi={multi}
            keyValue="planningId"
            value={value}
            handleChange={(_key, newValue) => setValue(newValue)}
        />
    );
};

describe('PlanningsDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCurrentUser.mockReturnValue(userWithPlanningRead);
        mockUseGetPlanningsOptions.mockReturnValue({
            data: planningOptions,
            isFetching: false,
        });
    });

    it('renders the planning select when the user has planning permissions', () => {
        renderWithThemeAndIntlProvider(<Wrapper />);

        expect(
            screen.getByRole('combobox', { name: 'Planning' }),
        ).toBeVisible();
        expect(mockUseGetPlanningsOptions).toHaveBeenCalledWith(
            undefined,
            true,
        );
    });

    it('updates the selected value when the user picks a planning', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(<Wrapper />);

        const combobox = screen.getByRole('combobox', { name: 'Planning' });

        await act(async () => {
            await user.click(combobox);
        });

        await act(async () => {
            await user.click(
                await screen.findByRole('option', { name: 'Planning Beta' }),
            );
        });

        await waitFor(() => {
            expect(combobox).toHaveValue('Planning Beta');
        });
    });

    it('clears the selection when the user clears the combobox', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(<Wrapper />);

        const combobox = screen.getByRole('combobox', { name: 'Planning' });

        await act(async () => {
            await user.click(combobox);
        });

        await act(async () => {
            await user.click(
                await screen.findByRole('option', { name: 'Planning Alpha' }),
            );
        });

        await waitFor(() => {
            expect(combobox).toHaveValue('Planning Alpha');
        });

        await act(async () => {
            await user.clear(combobox);
        });

        await waitFor(() => {
            expect(combobox).toHaveValue('');
        });
    });

    it('does not render the field when the user lacks planning permissions', () => {
        mockCurrentUser.mockReturnValue({
            id: 2,
            permissions: [],
        });

        const { container } = renderWithThemeAndIntlProvider(<Wrapper />);

        expect(container.querySelector('input')).toBeNull();
        expect(mockUseGetPlanningsOptions).toHaveBeenCalledWith(
            undefined,
            false,
        );
    });

    it('passes formIds to the plannings options hook', () => {
        renderWithThemeAndIntlProvider(<Wrapper formIds="10,20" />);

        expect(mockUseGetPlanningsOptions).toHaveBeenCalledWith('10,20', true);
    });
});
