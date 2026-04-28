import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import FormVersionsDiffTables from './FormVersionsDiffTables';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (
                msg: { defaultMessage?: string },
                values?: Record<string, unknown>,
            ) => {
                let text = msg?.defaultMessage ?? '';
                if (values) {
                    Object.entries(values).forEach(([key, val]) => {
                        text = text.replace(`{${key}}`, String(val));
                    });
                }
                return text;
            },
        }),
    };
});

const removedQuestions = [
    { name: 'q_removed_1', label: 'Removed one', type: 'text' },
    { name: 'q_removed_2', label: 'Removed two', type: 'integer' },
];

const modifiedQuestions = [
    {
        name: 'q_modified_1',
        label: 'Modified one',
        old_type: 'text',
        new_type: 'integer',
    },
];

describe('FormVersionsDiffTables', () => {
    it('renders nothing when both arrays are empty', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <FormVersionsDiffTables
                removedQuestions={[]}
                modifiedQuestions={[]}
            />,
        );
        expect(container.querySelector('table')).toBeNull();
    });

    it('renders removed questions table with correct columns and rows', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffTables
                removedQuestions={removedQuestions}
                modifiedQuestions={[]}
            />,
        );

        expect(
            screen.getByText('Removed or renamed questions (2)'),
        ).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Label')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();

        expect(screen.getByText('q_removed_1')).toBeInTheDocument();
        expect(screen.getByText('Removed one')).toBeInTheDocument();
        expect(screen.getByText('text')).toBeInTheDocument();

        expect(screen.getByText('q_removed_2')).toBeInTheDocument();
        expect(screen.getByText('Removed two')).toBeInTheDocument();
        expect(screen.getByText('integer')).toBeInTheDocument();
    });

    it('does not render the modified table when modifiedQuestions is empty', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffTables
                removedQuestions={removedQuestions}
                modifiedQuestions={[]}
            />,
        );

        expect(
            screen.queryByText('Questions with changed type (0)'),
        ).toBeNull();
        expect(screen.queryByText('Previous type')).toBeNull();
        expect(screen.queryByText('New type')).toBeNull();
    });

    it('renders modified questions table with correct columns and rows', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffTables
                removedQuestions={[]}
                modifiedQuestions={modifiedQuestions}
            />,
        );

        expect(
            screen.getByText('Questions with changed type (1)'),
        ).toBeInTheDocument();
        expect(screen.getByText('Previous type')).toBeInTheDocument();
        expect(screen.getByText('New type')).toBeInTheDocument();

        expect(screen.getByText('q_modified_1')).toBeInTheDocument();
        expect(screen.getByText('Modified one')).toBeInTheDocument();
        const cells = screen.getAllByRole('cell');
        const cellTexts = cells.map(c => c.textContent);
        expect(cellTexts).toContain('text');
        expect(cellTexts).toContain('integer');
    });

    it('does not render the removed table when removedQuestions is empty', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffTables
                removedQuestions={[]}
                modifiedQuestions={modifiedQuestions}
            />,
        );

        expect(screen.queryByText(/Removed or renamed questions/)).toBeNull();
        expect(screen.queryByText('Type')).toBeNull();
    });

    it('renders both tables when both arrays are non-empty', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffTables
                removedQuestions={removedQuestions}
                modifiedQuestions={modifiedQuestions}
            />,
        );

        expect(
            screen.getByText('Removed or renamed questions (2)'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Questions with changed type (1)'),
        ).toBeInTheDocument();

        const tables = screen.getAllByRole('table');
        expect(tables).toHaveLength(2);
    });
});
