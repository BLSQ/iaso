import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionContentHeader } from './SubmissionContentHeader';
import { makeSection } from './testUtils';

describe('SubmissionContentHeader a11y', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionContentHeader
                section={makeSection()}
                isSearching={false}
                showQuestionIds
            />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations while searching', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionContentHeader
                section={makeSection({ totalFields: 4 })}
                isSearching
                showQuestionIds={false}
            />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});
