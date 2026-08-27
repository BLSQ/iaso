import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionQuestionId } from './SubmissionQuestionId';

describe('SubmissionQuestionId', () => {
    it('renders the question id', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionQuestionId id="facility_name" query="" />,
        );
        expect(screen.getByText('facility_name')).toBeInTheDocument();
    });

    it('highlights a matching query inside the id', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionQuestionId id="facility_name" query="name" />,
        );
        expect(container.querySelector('mark')).toHaveTextContent('name');
    });
});
