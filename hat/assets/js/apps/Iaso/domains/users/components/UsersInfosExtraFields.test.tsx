import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { UsersInfosExtraFields } from 'Iaso/domains/users/components/UsersInfosExtraFields';
import { UserDialogData } from 'Iaso/domains/users/types';
import {
    renderWithThemeAndIntlProvider,
    selectFromComboBoxWithAsync,
} from '../../../../../tests/helpers';

// mock
const { mockUseGetProjectsDropdownOptions } = vi.hoisted(() => {
    return { mockUseGetProjectsDropdownOptions: vi.fn() };
});

vi.mock('Iaso/domains/projects/hooks/requests', async () => {
    return {
        useGetProjectsDropdownOptions: mockUseGetProjectsDropdownOptions,
    };
});

const { mockCurrentUser } = vi.hoisted(() => {
    return { mockCurrentUser: vi.fn() };
});

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: mockCurrentUser,
}));

describe('UsersInfosExtraFields test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseGetProjectsDropdownOptions.mockReturnValue({
            isFetching: false,
            data: [
                {
                    label: 'projectOption',
                    value: 1,
                    color: '#bbbbbb',
                },
            ],
        });
    });
    it('sets projects value', async () => {
        const mockSetFieldValue = vi.fn();
        let currentUser: Partial<UserDialogData> = {
            projects: {
                // @ts-ignore
                value: '',
                errors: [],
            },
            color: {
                value: '',
                errors: [],
            },
        };

        mockCurrentUser.mockReturnValue(currentUser);
        const { rerender } = renderWithThemeAndIntlProvider(
            <UsersInfosExtraFields
                setFieldValue={mockSetFieldValue}
                currentUser={currentUser as UserDialogData}
                canBypassProjectRestrictions={true}
            />,
        );

        await act(async () => {
            await selectFromComboBoxWithAsync({
                nameComboBox: /projects/i,
                nameOption: 'projectOption',
            });
        });

        expect(mockSetFieldValue).toHaveBeenCalledWith('projects', [1]);
        currentUser = {
            projects: {
                // @ts-ignore
                value: '1',
                errors: [],
            },
            color: {
                value: '',
                errors: [],
            },
        };

        rerender(
            <UsersInfosExtraFields
                setFieldValue={mockSetFieldValue}
                currentUser={currentUser as UserDialogData}
                canBypassProjectRestrictions={true}
            />,
        );

        expect(screen.getByText('projectOption')).toBeVisible();

        // click the delete icon
        const usrEvent = userEvent.setup();
        await act(async () => {
            await usrEvent.click(screen.getByTestId('CancelIcon'));
        });

        expect(mockSetFieldValue).toHaveBeenCalledWith('projects', []);
    });
});
