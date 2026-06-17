import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldInputProps, FormikProps } from 'formik';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';

import { UsersSelect } from './UsersSelect';

const { mockCurrentUser } = vi.hoisted(() => ({
    mockCurrentUser: vi.fn(),
}));

vi.mock('Iaso/utils/usersUtils', async () => {
    const actual = await vi.importActual('Iaso/utils/usersUtils');
    return {
        ...actual,
        useCurrentUser: mockCurrentUser,
    };
});

vi.mock('Iaso/components/filters/UserAsyncSelect', () => ({
    UserAsyncSelect: (props: Record<string, any>) => (
        <div data-testid="user-async-select-mock">
            <span data-testid="filter-users">{props.filterUsers ?? ''}</span>
            <span data-testid="managed-only">
                {props.additionalFilters?.managedUsersOnly ?? ''}
            </span>
            <span data-testid="key-value">{props.keyValue ?? ''}</span>
            <button
                type="button"
                data-testid="simulate-users-change"
                onClick={() =>
                    props.handleChange(props.keyValue ?? 'users', '7,8')
                }
            >
                simulate change
            </button>
        </div>
    ),
}));

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string } | string) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? ''),
        }),
    };
});

type FormValues = { users: string };

const baseField = (value: number[] | undefined): FieldInputProps<number[]> =>
    ({
        name: 'users',
        value,
        onBlur: vi.fn(),
        onChange: vi.fn(),
    }) as FieldInputProps<number[]>;

const baseForm = (
    setFieldValue: ReturnType<typeof vi.fn>,
    setFieldTouched: ReturnType<typeof vi.fn>,
): FormikProps<FormValues> =>
    ({
        setFieldValue,
        setFieldTouched,
        values: { users: '' },
    }) as unknown as FormikProps<FormValues>;

describe('UsersSelect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCurrentUser.mockReturnValue({ user_id: 100 });
    });

    it('passes managedUsersOnly and filterUsers from field value', () => {
        const setFieldValue = vi.fn();
        const setFieldTouched = vi.fn();

        renderWithThemeAndIntlProvider(
            <UsersSelect
                field={baseField([1, 2, 3])}
                form={baseForm(setFieldValue, setFieldTouched)}
            />,
        );

        expect(screen.getByTestId('managed-only')).toHaveTextContent('true');
        expect(screen.getByTestId('filter-users')).toHaveTextContent('1,2,3');
        expect(screen.getByTestId('key-value')).toHaveTextContent('users');
    });

    it('uses current user id for filterUsers on new page when field is empty', () => {
        const setFieldValue = vi.fn();
        const setFieldTouched = vi.fn();

        renderWithThemeAndIntlProvider(
            <UsersSelect
                field={baseField([])}
                form={baseForm(setFieldValue, setFieldTouched)}
                isNewPage
            />,
        );

        expect(screen.getByTestId('filter-users')).toHaveTextContent('100');
    });

    it('maps handleChange string to setFieldValue as number[] and touches field', async () => {
        const user = userEvent.setup();
        const setFieldValue = vi.fn();
        const setFieldTouched = vi.fn();

        renderWithThemeAndIntlProvider(
            <UsersSelect
                field={baseField([1])}
                form={baseForm(setFieldValue, setFieldTouched)}
            />,
        );

        await user.click(screen.getByTestId('simulate-users-change'));

        expect(setFieldValue).toHaveBeenCalledWith('users', [7, 8]);
        expect(setFieldTouched).toHaveBeenCalledWith('users', true);
    });
});
