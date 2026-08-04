import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionHighlightText } from './SubmissionHighlightText';

describe('SubmissionHighlightText', () => {
    it('renders the text unchanged when the query is empty', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionHighlightText text="Hello world" query="" />,
        );
        expect(screen.getByText('Hello world')).toBeInTheDocument();
        expect(screen.queryByRole('mark')).not.toBeInTheDocument();
    });

    it('highlights the first case-insensitive match', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionHighlightText text="Hello world" query="WORLD" />,
        );
        const mark = container.querySelector('mark');
        expect(mark).toHaveTextContent('world');
        expect(container).toHaveTextContent('Hello world');
    });

    it('renders the text unchanged when there is no match', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionHighlightText text="Hello world" query="zzz" />,
        );
        expect(screen.getByText('Hello world')).toBeInTheDocument();
        expect(document.querySelector('mark')).not.toBeInTheDocument();
    });
});
