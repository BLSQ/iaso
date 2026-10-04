import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { FormVersionDiff } from '../requests';
import FormVersionsDiffConfirmation from './FormVersionsDiffConfirmation';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (
                msg: { defaultMessage?: string },
                values?: Record<string, unknown>,
            ) => {
                let text = msg?.defaultMessage ?? '';
                if (values) {
                    Object.entries(values).forEach(([key, val]) => {
                        text = text.replace(`{${key}}`, String(val));
                    });
                }
                return text;
            },
        }),
    };
});

const baseDiff: FormVersionDiff = {
    previous_version_id: '42',
    added_questions: [{ name: 'q_new', label: 'New Q', type: 'text' }],
    removed_questions: [{ name: 'q_gone', label: 'Gone Q', type: 'integer' }],
    modified_questions: [
        {
            name: 'q_changed',
            label: 'Changed Q',
            old_type: 'text',
            new_type: 'integer',
        },
    ],
    workflow_impacts: [],
};

const impact = {
    entity_type_id: 3,
    entity_type_name: 'Patients',
    workflow_version_id: 9,
    workflow_version_name: 'Follow-ups',
    workflow_version_status: 'PUBLISHED',
};

describe('FormVersionsDiffConfirmation', () => {
    it('renders the warning alert with the previous version id', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffConfirmation diff={baseDiff} />,
        );

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent('42');
    });

    it('falls back to em-dash when previous_version_id is null', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffConfirmation
                diff={{ ...baseDiff, previous_version_id: null }}
            />,
        );

        expect(screen.getByRole('alert')).toHaveTextContent('—');
    });

    it('renders the added questions chip with correct count', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffConfirmation diff={baseDiff} />,
        );

        expect(screen.getByText(/^\+1 added$/)).toBeInTheDocument();
    });

    it('renders the removed questions chip with correct count', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffConfirmation diff={baseDiff} />,
        );

        expect(screen.getByText(/^-1 removed or renamed$/)).toBeInTheDocument();
    });

    it('renders the modified questions chip with correct count', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffConfirmation diff={baseDiff} />,
        );

        expect(screen.getByText(/^~1 type changed$/)).toBeInTheDocument();
    });

    it('reflects plural counts in chips', () => {
        const diff: FormVersionDiff = {
            ...baseDiff,
            added_questions: [
                { name: 'a', label: 'A', type: 'text' },
                { name: 'b', label: 'B', type: 'text' },
            ],
            removed_questions: [
                { name: 'r1', label: 'R1', type: 'text' },
                { name: 'r2', label: 'R2', type: 'text' },
                { name: 'r3', label: 'R3', type: 'text' },
            ],
            modified_questions: [],
        };

        renderWithThemeAndIntlProvider(
            <FormVersionsDiffConfirmation diff={diff} />,
        );

        expect(screen.getByText(/^\+2 added$/)).toBeInTheDocument();
        expect(screen.getByText(/^-3 removed or renamed$/)).toBeInTheDocument();
        expect(screen.getByText(/^~0 type changed$/)).toBeInTheDocument();
    });

    it('shows the entity workflows reading the changed questions', () => {
        const diff: FormVersionDiff = {
            ...baseDiff,
            workflow_impacts: [
                {
                    ...impact,
                    kind: 'follow_up_condition',
                    question: 'q_changed',
                    follow_up_order: 2,
                    mapping_source: null,
                    mapping_target: null,
                },
                {
                    ...impact,
                    kind: 'change_mapping',
                    question: 'q_gone',
                    follow_up_order: null,
                    mapping_source: 'dob',
                    mapping_target: 'q_gone',
                },
            ],
        };

        renderWithThemeAndIntlProvider(
            <FormVersionsDiffConfirmation diff={diff} />,
        );

        expect(
            screen.getByText(/^2 used by entity workflows$/),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Removed or changed questions used by entity workflows (2)',
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Condition of follow-up 2'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Change mapping dob → q_gone'),
        ).toBeInTheDocument();
        expect(screen.getAllByText('Follow-ups (PUBLISHED)')).toHaveLength(2);
    });

    it('shows no workflow chip when no workflow reads them', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffConfirmation diff={baseDiff} />,
        );

        expect(
            screen.queryByText(/used by entity workflows/),
        ).not.toBeInTheDocument();
    });

    it('delegates table rendering to FormVersionsDiffTables', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsDiffConfirmation diff={baseDiff} />,
        );

        expect(
            screen.getByText('Removed or renamed questions (1)'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Questions with changed type (1)'),
        ).toBeInTheDocument();
    });
});
