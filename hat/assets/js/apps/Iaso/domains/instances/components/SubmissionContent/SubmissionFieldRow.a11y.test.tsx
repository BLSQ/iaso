import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionFieldRow } from './SubmissionFieldRow';
import { makeField } from './testUtils';

vi.mock('../SubmissionValue', () => ({
    SubmissionValue: ({ field }: { field: { value: string } }) => (
        <span>{field.value}</span>
    ),
}));

describe('SubmissionFieldRow a11y', () => {
    it('has no accessibility violations in one-column layout', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionFieldRow
                field={makeField({
                    kind: 'text',
                    label: 'Facility name',
                    value: 'Sweet Wright',
                })}
                files={[]}
                showQuestionIds
                query=""
                twoColumns={false}
            />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it('has no accessibility violations in two-column layout', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionFieldRow
                field={makeField({
                    kind: 'text',
                    label: 'Facility name',
                    value: 'Sweet Wright',
                })}
                files={[]}
                showQuestionIds={false}
                query=""
                twoColumns
                hideBorder
            />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});
