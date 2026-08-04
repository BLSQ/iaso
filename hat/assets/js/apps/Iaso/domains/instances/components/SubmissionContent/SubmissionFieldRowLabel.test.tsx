import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionFieldRowLabel } from './SubmissionFieldRowLabel';
import { makeField } from './testUtils';

describe('SubmissionFieldRowLabel', () => {
    it('renders the field label', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionFieldRowLabel
                field={makeField({
                    kind: 'text',
                    label: 'Facility name',
                })}
                query=""
                showId={false}
            />,
        );
        expect(screen.getByText('Facility name')).toBeInTheDocument();
        expect(screen.queryByText('q1')).not.toBeInTheDocument();
    });

    it('shows the question id when showId is true', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionFieldRowLabel
                field={makeField({
                    kind: 'text',
                    id: 'facility_name',
                    label: 'Facility name',
                })}
                query=""
                showId
            />,
        );
        expect(screen.getByText('facility_name')).toBeInTheDocument();
    });

    it('shows a calculated icon when the field is calculated', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionFieldRowLabel
                field={makeField({
                    kind: 'calculated',
                    label: 'Total',
                    tooltip: 'a + b',
                })}
                query=""
                showId={false}
            />,
        );
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('highlights a matching query in the label', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionFieldRowLabel
                field={makeField({
                    kind: 'text',
                    label: 'Facility name',
                })}
                query="Facility"
                showId={false}
            />,
        );
        expect(container.querySelector('mark')).toHaveTextContent('Facility');
    });
});
