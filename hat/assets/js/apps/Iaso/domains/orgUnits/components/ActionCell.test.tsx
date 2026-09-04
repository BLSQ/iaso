import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userHasPermission } from 'Iaso/domains/users/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { ActionCell } from './ActionCell';

const mockMutateAsync = vi.fn();

vi.mock('Iaso/domains/orgUnits/hooks', () => ({
    useSaveOrgUnit: () => ({
        mutateAsync: mockMutateAsync,
        isLoading: false,
    }),
}));

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: vi.fn(),
}));

vi.mock('Iaso/domains/users/utils', () => ({
    userHasPermission: vi.fn(),
}));

const renderActionCell = (ui: React.ReactElement) => {
    return renderWithThemeAndIntlProvider(<MemoryRouter>{ui}</MemoryRouter>);
};

const defaultOrgUnit = {
    id: 1,
    name: 'Test Org Unit',
    validation_status: 'NEW',
    has_geo_json: true,
    latitude: 1.23,
    longitude: 4.56,
} as any;

describe('ActionCell', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useCurrentUser).mockReturnValue({} as any);
        vi.mocked(userHasPermission).mockReturnValue(true);
    });

    it('renders reject button when user has permission and orgUnit validation_status is not REJECTED', () => {
        vi.mocked(userHasPermission).mockReturnValue(true);
        renderActionCell(<ActionCell orgUnit={defaultOrgUnit} />);

        expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
    });

    it('does not render reject button when user does not have permission', () => {
        vi.mocked(userHasPermission).mockReturnValue(false);
        renderActionCell(<ActionCell orgUnit={defaultOrgUnit} />);

        expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
    });

    it('does not render reject button when validation_status is REJECTED', () => {
        vi.mocked(userHasPermission).mockReturnValue(true);
        const rejectedOrgUnit = {
            ...defaultOrgUnit,
            validation_status: 'REJECTED',
        };
        renderActionCell(<ActionCell orgUnit={rejectedOrgUnit} />);

        expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
    });

    it('opens confirm modal and calls saveOu on confirm', async () => {
        const user = userEvent.setup();
        renderActionCell(<ActionCell orgUnit={defaultOrgUnit} />);

        // Modal should *not* be in document initially
        expect(screen.queryByText('Reject Org Unit')).not.toBeInTheDocument();

        const rejectButton = screen
            .getByTestId('DeleteIcon')
            .closest('button')!;
        await user.click(rejectButton);

        expect(screen.getByText('Reject Org Unit')).toBeInTheDocument();
        expect(
            screen.getByText(/are you sure you want to reject this org unit/i),
        ).toBeInTheDocument();

        const confirmButton = screen.getByRole('button', { name: /yes/i });
        await user.click(confirmButton);

        expect(mockMutateAsync).toHaveBeenCalledWith({
            id: defaultOrgUnit.id,
            validation_status: 'REJECTED',
        });
    });
});
