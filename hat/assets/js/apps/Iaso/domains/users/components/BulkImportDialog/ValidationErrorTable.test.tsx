import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../../../../../tests/helpers';
import { ValidationErrorTable } from './ValidationErrorTable';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: any) => msg.defaultMessage || msg.id || msg,
        }),
    };
});

// mock messages
vi.mock('../../messages', async () => {
    const actual = await vi.importActual('../../messages');
    return {
        ...actual,
        row: { id: 'row', defaultMessage: 'Row' },
        field: { id: 'field', defaultMessage: 'Field' },
        errorMessage: { id: 'errorMessage', defaultMessage: 'Error message' },
    };
});

describe('ValidationErrorTable', () => {
    it('renders general errors as alerts', () => {
        renderWithTheme(
            <ValidationErrorTable
                errors={[{ general: 'Something went wrong' }]}
            />,
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders table when row errors exist', () => {
        renderWithTheme(
            <ValidationErrorTable
                errors={[
                    {
                        row: 1,
                        errors: { name: 'Required field' },
                    },
                ]}
            />,
        );

        expect(
            screen.getByRole('columnheader', { name: 'Row' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: 'Field' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: 'Error' }),
        ).toBeInTheDocument();

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('Required field')).toBeInTheDocument();
    });

    it('renders multiple field errors for a single row', () => {
        renderWithTheme(
            <ValidationErrorTable
                errors={[
                    {
                        row: 2,
                        errors: {
                            name: 'Required',
                            email: 'Invalid',
                        },
                    },
                ]}
            />,
        );

        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(screen.getByText('Invalid')).toBeInTheDocument();
    });

    it('renders both general and row errors together', () => {
        renderWithTheme(
            <ValidationErrorTable
                errors={[
                    { general: 'Global error' },
                    {
                        row: 3,
                        errors: { field1: 'Error 1' },
                    },
                ]}
            />,
        );

        expect(screen.getByText('Global error')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('field1')).toBeInTheDocument();
        expect(screen.getByText('Error 1')).toBeInTheDocument();
    });

    it('does not render table if only general errors exist', () => {
        renderWithTheme(
            <ValidationErrorTable
                errors={[{ general: 'Only general error' }]}
            />,
        );

        expect(screen.queryByText('Row')).not.toBeInTheDocument();
    });

    it('renders nothing if errors array is empty', () => {
        const { container } = renderWithTheme(
            <ValidationErrorTable errors={[]} />,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
