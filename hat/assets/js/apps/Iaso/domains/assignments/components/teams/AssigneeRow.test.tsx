import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { AssigneeRow } from './AssigneeRow';

const mockMutateAsync = vi.fn();

vi.mock('../../hooks/requests/useBulkDeleteAssignments', () => ({
    useBulkDeleteAssignments: () => ({
        mutateAsync: mockMutateAsync,
    }),
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        IconButton: ({
            onClick,
            disabled,
        }: {
            onClick: () => void;
            disabled?: boolean;
        }) => (
            <button
                type="button"
                data-testid="delete-assignment-button"
                onClick={onClick}
                disabled={disabled}
            >
                Delete
            </button>
        ),
    };
});

vi.mock('Iaso/components/forms/ColorPicker', () => ({
    ColorPicker: ({
        onChangeColor,
    }: {
        onChangeColor: (color: string) => void;
    }) => (
        <button
            type="button"
            data-testid="color-picker-button"
            onClick={() => onChangeColor('#abcdef')}
        >
            Color
        </button>
    ),
}));

const baseProps = {
    planningId: '42',
    radioGroupName: 'assignee-42',
    isActive: false,
    setSelectedRow: vi.fn(),
    currentColor: '#111111',
    displayName: 'Display Name',
    count: 3,
    onColorChange: vi.fn(),
};

const renderAssigneeRow = (props = {}) =>
    renderWithThemeAndIntlProvider(
        <table>
            <tbody>
                <AssigneeRow {...baseProps} {...props} />
            </tbody>
        </table>,
    );

describe('AssigneeRow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls setSelectedRow when the radio is changed', () => {
        renderAssigneeRow();

        fireEvent.click(screen.getByRole('radio'));

        expect(baseProps.setSelectedRow).toHaveBeenCalledTimes(1);
    });

    it('forwards chosen color to onColorChange', () => {
        renderAssigneeRow();

        fireEvent.click(screen.getByTestId('color-picker-button'));

        expect(baseProps.onColorChange).toHaveBeenCalledWith('#abcdef');
    });

    it('deletes assignments by team when a team is provided', () => {
        renderAssigneeRow({
            team: { id: 7, name: 'Sub team', color: '#00ff00' },
        });

        fireEvent.click(screen.getByTestId('delete-assignment-button'));

        expect(mockMutateAsync).toHaveBeenCalledWith({
            planning: '42',
            team: 7,
        });
    });

    it('deletes assignments by user when a user is provided', () => {
        renderAssigneeRow({
            user: {
                id: 9,
                username: 'john',
                first_name: 'John',
                last_name: 'Doe',
                color: '#123456',
                iaso_profile_id: 99,
            },
        });

        fireEvent.click(screen.getByTestId('delete-assignment-button'));

        expect(mockMutateAsync).toHaveBeenCalledWith({
            planning: '42',
            user: 9,
        });
    });

    it('disables delete button when count is zero', () => {
        renderAssigneeRow({
            count: 0,
            team: { id: 1, name: 'T', color: '#0f0' },
        });

        expect(screen.getByTestId('delete-assignment-button')).toBeDisabled();
    });
});
