import React from 'react';
import { screen } from '@testing-library/react';
import moment from 'moment';
import { describe, expect, it, vi } from 'vitest';
import { getLocaleDateFormat } from 'Iaso/utils/dates';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { ValidationWorkflowInstanceListResponseItem } from '../types';
import {
    OrgUnitCell,
    SubmissionCell,
    SubmittedByCell,
    ValidationCell,
} from './Cells';

vi.mock('../../../components/nav/LinkTo', () => ({
    LinkTo: ({ url, text }: { url: string; text: string }) => (
        <a href={url}>{text}</a>
    ),
}));

const buildItem = (
    overrides: Partial<ValidationWorkflowInstanceListResponseItem> = {},
): ValidationWorkflowInstanceListResponseItem => ({
    id: 12,
    display_name: 'FAC-2026-0412',
    form: { id: 7, name: 'Pièce justificative' },
    workflow: { id: 2, name: 'Remboursement mensuel' },
    org_unit: {
        id: 5,
        name: 'CS Kingasani',
        parent: { id: 4, name: 'DPS Kinshasa' },
    },
    project: { id: 1, name: 'Project', color: '#000' },
    general_validation_status: 'Pending',
    validation_status: 'PENDING',
    user_has_been_involved: true,
    requires_user_action: true,
    handled_by_me: true,
    last_updated: null,
    pending_since: moment().subtract(11, 'days').toISOString(),
    submitted_by: {
        id: 3,
        username: 'jmbala',
        first_name: 'Jean',
        last_name: 'Mbala',
    },
    submitted_at: '2026-03-12T10:00:00Z',
    is_resubmission: false,
    current_steps: [
        {
            id: 100,
            node_template_id: 10,
            name: 'District validation',
            position: 2,
            pending_since: moment().subtract(11, 'days').toISOString(),
            user_can_act: true,
        },
    ],
    step_count: 3,
    last_user_action: {
        status: 'ACCEPTED',
        name: 'Submission check',
        position: 1,
        date: '2026-03-13T10:00:00Z',
    },
    ...overrides,
});

describe('SubmissionCell', () => {
    it('links to the submission validation page, with the workflow and submission date', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionCell item={buildItem()} accountId={3} />,
        );
        const link = screen.getByRole('link', {
            name: 'Pièce justificative — FAC-2026-0412',
        });
        expect(link).toHaveAttribute(
            'href',
            '/forms/submission/referenceFormId/7/instanceId/12/accountId/3/isValidating/true/',
        );
        expect(
            screen.getByText(
                `Remboursement mensuel · ${moment('2026-03-12T10:00:00Z').format(getLocaleDateFormat('L'))}`,
            ),
        ).toBeInTheDocument();
    });
});

describe('OrgUnitCell', () => {
    it('shows the org unit and its parent', () => {
        renderWithThemeAndIntlProvider(<OrgUnitCell item={buildItem()} />);
        expect(screen.getByText('CS Kingasani')).toBeInTheDocument();
        expect(screen.getByText('DPS Kinshasa')).toBeInTheDocument();
    });
});

describe('SubmittedByCell', () => {
    it('shows the user who sent the submission for validation', () => {
        renderWithThemeAndIntlProvider(<SubmittedByCell item={buildItem()} />);
        expect(screen.getByText('Jean Mbala')).toBeInTheDocument();
        expect(screen.queryByText(/jmbala/)).not.toBeInTheDocument();
    });

    it('falls back to the username when the user has no name', () => {
        renderWithThemeAndIntlProvider(
            <SubmittedByCell
                item={buildItem({
                    submitted_by: {
                        id: 3,
                        username: 'jmbala',
                        first_name: '',
                        last_name: '',
                    },
                })}
            />,
        );
        expect(screen.getByText('jmbala')).toBeInTheDocument();
    });
});

describe('ValidationCell', () => {
    it('shows the current step, the waiting time and my last action', () => {
        renderWithThemeAndIntlProvider(<ValidationCell item={buildItem()} />);
        expect(screen.getByText('Step 2 / 3')).toBeInTheDocument();
        expect(screen.getByText('District validation')).toBeInTheDocument();
        expect(
            screen.getByText('Waiting on you · 11 days'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                `You approved step 1 on ${moment('2026-03-13T10:00:00Z').format(getLocaleDateFormat('L'))}`,
            ),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Resubmitted after rejection'),
        ).not.toBeInTheDocument();
    });

    it('shows when the submission waits on somebody else, and resubmissions', () => {
        renderWithThemeAndIntlProvider(
            <ValidationCell
                item={buildItem({
                    requires_user_action: false,
                    is_resubmission: true,
                    last_user_action: null,
                    pending_since: moment().toISOString(),
                })}
            />,
        );
        expect(
            screen.getByText('Waiting on others · today'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Resubmitted after rejection'),
        ).toBeInTheDocument();
    });

    it('shows the status when the validation is over', () => {
        renderWithThemeAndIntlProvider(
            <ValidationCell
                item={buildItem({
                    validation_status: 'REJECTED',
                    current_steps: [],
                    pending_since: null,
                    last_user_action: {
                        status: 'REJECTED',
                        name: 'District validation',
                        position: null,
                        date: '2026-03-13T10:00:00Z',
                    },
                })}
            />,
        );
        expect(screen.getByTestId('validation-status-chip')).toHaveTextContent(
            'Rejected',
        );
        expect(
            screen.getByText(
                `You rejected "District validation" on ${moment('2026-03-13T10:00:00Z').format(getLocaleDateFormat('L'))}`,
            ),
        ).toBeInTheDocument();
        expect(screen.queryByText(/Waiting on/)).not.toBeInTheDocument();
    });
});
