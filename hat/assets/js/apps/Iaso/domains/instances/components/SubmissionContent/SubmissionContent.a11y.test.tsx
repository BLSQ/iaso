import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionContent } from './SubmissionContent';
import { formDescriptor, instanceData } from './testUtils';

vi.mock('../SubmissionValue', () => ({
    SubmissionValue: ({ field }: { field: { value: string } }) => (
        <span>{field.value}</span>
    ),
}));

vi.mock('../InstanceFileContentBasic', () => ({
    default: ({ fileContent }: { fileContent: Record<string, unknown> }) => (
        <div data-testid="basic-content">{JSON.stringify(fileContent)}</div>
    ),
}));

describe('SubmissionContent a11y', () => {
    it('basic fallback has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionContent instanceData={{ foo: 'bar' }} />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it('populated form has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionContent
                formDescriptor={formDescriptor}
                instanceData={instanceData}
            />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it('search results state has no accessibility violations', async () => {
        const user = userEvent.setup();
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionContent
                formDescriptor={formDescriptor}
                instanceData={instanceData}
            />,
        );
        await user.type(screen.getByPlaceholderText('Search'), 'Age');
        expect(await axe(container)).toHaveNoViolations();
    });

    it('empty search state has no accessibility violations', async () => {
        const user = userEvent.setup();
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionContent
                formDescriptor={formDescriptor}
                instanceData={instanceData}
            />,
        );
        await user.type(screen.getByPlaceholderText('Search'), 'zzzz');
        expect(await axe(container)).toHaveNoViolations();
    });
});
