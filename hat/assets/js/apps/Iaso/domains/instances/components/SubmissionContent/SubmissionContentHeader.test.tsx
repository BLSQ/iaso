import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionContentHeader } from './SubmissionContentHeader';
import { makeSection } from './testUtils';

describe('SubmissionContentHeader', () => {
    it('renders the section label and field count', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionContentHeader
                section={makeSection({
                    label: 'Introduction',
                    fields: makeSection().fields,
                    totalFields: 3,
                })}
                isSearching={false}
                showQuestionIds={false}
            />,
        );
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('1 field')).toBeInTheDocument();
    });

    it('renders matching counts while searching', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionContentHeader
                section={makeSection({
                    label: 'Introduction',
                    totalFields: 5,
                })}
                isSearching
                showQuestionIds={false}
            />,
        );
        expect(screen.getByText('1 of 5')).toBeInTheDocument();
    });

    it('shows the section id when showQuestionIds is on', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionContentHeader
                section={makeSection({ id: 'intro_group' })}
                isSearching={false}
                showQuestionIds
            />,
        );
        expect(screen.getByText('intro_group')).toBeInTheDocument();
    });
});
