import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionContent } from './SubmissionContent';
import { formDescriptor, instanceData } from './testUtils';

vi.mock('../SubmissionValue', () => ({
    SubmissionValue: ({
        field,
    }: {
        field: { value: string; label?: string };
    }) => <span data-testid={`value-${field.value}`}>{field.value}</span>,
}));

vi.mock('../InstanceFileContentBasic', () => ({
    default: ({ fileContent }: { fileContent: Record<string, unknown> }) => (
        <div data-testid="basic-content">{JSON.stringify(fileContent)}</div>
    ),
}));

describe('SubmissionContent', () => {
    it('falls back to the basic file content view without a form descriptor', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionContent instanceData={{ foo: 'bar' }} />,
        );
        expect(screen.getByTestId('basic-content')).toHaveTextContent(
            '{"foo":"bar"}',
        );
    });

    it('renders the toolbar and section fields for a form descriptor', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionContent
                formDescriptor={formDescriptor}
                instanceData={instanceData}
            />,
        );
        expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
        expect(screen.getByText('Show question IDs')).toBeInTheDocument();
        expect(
            screen.getByRole('group', { name: 'Layout density' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
        expect(screen.getByTestId('value-Ada')).toBeInTheDocument();
        expect(screen.getByTestId('value-36')).toBeInTheDocument();
    });

    it('filters fields when searching and can clear the query', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(
            <SubmissionContent
                formDescriptor={formDescriptor}
                instanceData={instanceData}
            />,
        );

        await user.type(screen.getByPlaceholderText('Search'), 'Age');

        expect(screen.getByText('Age')).toBeInTheDocument();
        expect(screen.queryByText('Name')).not.toBeInTheDocument();
        expect(screen.getByText(/1 result/i)).toBeInTheDocument();

        await user.click(screen.getByText('Clear search'));
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
    });

    it('shows an empty search state when nothing matches', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(
            <SubmissionContent
                formDescriptor={formDescriptor}
                instanceData={instanceData}
            />,
        );

        await user.type(screen.getByPlaceholderText('Search'), 'zzzz');

        expect(
            screen.getAllByText(/No question name or ID matches "zzzz"/),
        ).not.toHaveLength(0);
    });

    it('toggles question ids', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(
            <SubmissionContent
                formDescriptor={formDescriptor}
                instanceData={instanceData}
            />,
        );

        expect(screen.queryByText('name')).not.toBeInTheDocument();
        await user.click(screen.getByRole('checkbox'));
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('age')).toBeInTheDocument();
    });

    it('switches to two-column layout', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(
            <SubmissionContent
                formDescriptor={formDescriptor}
                instanceData={instanceData}
            />,
        );

        const twoColumns = screen.getByRole('button', { name: 'Two columns' });
        expect(twoColumns).toHaveAttribute('aria-pressed', 'false');
        await user.click(twoColumns);
        expect(twoColumns).toHaveAttribute('aria-pressed', 'true');
    });
});
