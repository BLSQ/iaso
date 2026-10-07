import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionFieldRowLabel } from './SubmissionFieldRowLabel';
import { makeField } from './testUtils';

describe('SubmissionFieldRowLabel a11y', () => {
    it('has no accessibility violations for a text field', async () => {
        const { container } = renderWithThemeAndIntlProvider(
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
        expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations for a calculated field', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionFieldRowLabel
                field={makeField({
                    kind: 'calculated',
                    label: 'Total',
                    tooltip: 'a + b',
                })}
                query="Total"
                showId={false}
            />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});
