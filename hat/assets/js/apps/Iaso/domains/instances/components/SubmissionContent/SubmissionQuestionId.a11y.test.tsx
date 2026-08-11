import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionQuestionId } from './SubmissionQuestionId';

describe('SubmissionQuestionId a11y', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionQuestionId id="facility_name" query="name" />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});
