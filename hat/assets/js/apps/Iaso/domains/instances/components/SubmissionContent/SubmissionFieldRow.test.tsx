import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionFieldRow } from './SubmissionFieldRow';
import { makeField } from './testUtils';

vi.mock('../SubmissionValue', () => ({
    SubmissionValue: ({ field }: { field: { value: string } }) => (
        <span data-testid="submission-value">{field.value}</span>
    ),
}));

describe('SubmissionFieldRow', () => {
    it('renders the label and value', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionFieldRow
                field={makeField({
                    kind: 'text',
                    label: 'Facility name',
                    value: 'Sweet Wright',
                })}
                files={[]}
                showQuestionIds={false}
                query=""
                twoColumns={false}
            />,
        );
        expect(screen.getByText('Facility name')).toBeInTheDocument();
        expect(screen.getByTestId('submission-value')).toHaveTextContent(
            'Sweet Wright',
        );
    });

    it('shows the question id when showQuestionIds is on', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionFieldRow
                field={makeField({
                    kind: 'text',
                    id: 'facility_name',
                    label: 'Facility name',
                })}
                files={[]}
                showQuestionIds
                query=""
                twoColumns={false}
            />,
        );
        expect(screen.getByText('facility_name')).toBeInTheDocument();
    });

    it('reveals the question id when the query matches the id', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionFieldRow
                field={makeField({
                    kind: 'text',
                    id: 'facility_name',
                    label: 'Facility name',
                })}
                files={[]}
                showQuestionIds={false}
                query="facility"
                twoColumns={false}
            />,
        );
        expect(container.querySelector('code')).toHaveTextContent(
            'facility_name',
        );
    });

    it('exposes the raw value as a title on the value container', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionFieldRow
                field={makeField({
                    kind: 'text',
                    value: 'Shown',
                    rawValue: 'raw-value',
                })}
                files={[]}
                showQuestionIds={false}
                query=""
                twoColumns={false}
            />,
        );
        expect(screen.getByTitle('raw-value')).toBeInTheDocument();
    });
});
