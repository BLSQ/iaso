import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionHighlightText } from './SubmissionHighlightText';

describe('SubmissionHighlightText a11y', () => {
    it('has no accessibility violations without a highlight', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionHighlightText text="Hello world" query="" />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations with a highlight', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionHighlightText text="Hello world" query="world" />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});
