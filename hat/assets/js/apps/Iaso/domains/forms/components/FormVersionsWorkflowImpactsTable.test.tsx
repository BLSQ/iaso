import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { WorkflowImpact } from '../requests';
import FormVersionsWorkflowImpactsTable from './FormVersionsWorkflowImpactsTable';

const { mockReadableJsonLogicForForm, mockUser } = vi.hoisted(() => ({
    mockReadableJsonLogicForForm: vi.fn(),
    mockUser: { current: {} as Record<string, unknown> },
}));

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

vi.mock('../../workflows/hooks/useHumanReadableJsonLogicForForm', () => ({
    useHumanReadableJsonLogicForForm: mockReadableJsonLogicForForm,
}));

vi.mock('../../../utils/usersUtils', () => ({
    useCurrentUser: () => mockUser.current,
}));

vi.mock('../../users/utils', () => ({
    userHasPermission: (permission: string, user: Record<string, unknown>) =>
        Boolean(
            (user.permissions as string[] | undefined)?.includes(permission),
        ),
}));

vi.mock('../../../components/nav/LinkTo', () => ({
    LinkTo: ({
        condition,
        url,
        text,
        target,
    }: {
        condition: boolean;
        url: string;
        text: string;
        target: string;
    }) =>
        condition ? (
            <a href={url} target={target}>
                {text}
            </a>
        ) : (
            <>{text}</>
        ),
}));

const common = {
    entity_type_id: 3,
    entity_type_name: 'Patients',
    workflow_version_id: 9,
    workflow_version_name: 'Follow-ups',
    workflow_version_status: 'PUBLISHED' as const,
};

const workflowImpacts: WorkflowImpact[] = [
    {
        ...common,
        kind: 'follow_up_condition',
        question: 'age',
        follow_up_order: 2,
        follow_up_condition: { '<': [{ var: 'age' }, 24] },
        mapping_source: null,
        mapping_target: null,
    },
    {
        ...common,
        kind: 'change_mapping',
        question: 'birth_date',
        follow_up_order: null,
        follow_up_condition: null,
        mapping_source: 'dob',
        mapping_target: 'birth_date',
    },
];

describe('FormVersionsWorkflowImpactsTable', () => {
    beforeEach(() => {
        mockReadableJsonLogicForForm.mockReset();
        mockReadableJsonLogicForForm.mockReturnValue(
            (logic: Record<string, unknown>) =>
                `readable ${JSON.stringify(logic)}`,
        );
        mockUser.current = { permissions: ['iaso_workflows'] };
    });

    it('renders the title and one row per impact', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsWorkflowImpactsTable
                formId={7}
                workflowImpacts={workflowImpacts}
            />,
        );

        expect(
            screen.getByText(
                'Removed or changed questions used by entity workflows (2)',
            ),
        ).toBeInTheDocument();
        ['Name', 'Entity type', 'Workflow version', 'Used in'].forEach(header =>
            expect(
                screen.getByRole('columnheader', { name: header }),
            ).toBeInTheDocument(),
        );
        expect(screen.getAllByRole('row')).toHaveLength(3);
        expect(screen.getAllByText('Patients')).toHaveLength(2);
        expect(
            screen.getByText('Change mapping dob → birth_date'),
        ).toBeInTheDocument();
    });

    it('shows the follow-up condition as an expression, with the fields of the form', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsWorkflowImpactsTable
                formId={7}
                workflowImpacts={workflowImpacts}
            />,
        );

        expect(mockReadableJsonLogicForForm).toHaveBeenCalledWith(7);
        expect(
            screen.getByText('Condition of follow-up 2'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('readable {"<":[{"var":"age"},24]}'),
        ).toBeInTheDocument();
        // the mapping row has no condition
        expect(screen.getAllByText(/^readable /)).toHaveLength(1);
    });

    it('links each workflow version to its page, in a new tab', () => {
        renderWithThemeAndIntlProvider(
            <FormVersionsWorkflowImpactsTable
                formId={7}
                workflowImpacts={workflowImpacts}
            />,
        );

        const links = screen.getAllByRole('link', {
            name: 'Follow-ups (PUBLISHED)',
        });
        expect(links).toHaveLength(2);
        links.forEach(link => {
            expect(link).toHaveAttribute(
                'href',
                '/workflows/details/entityTypeId/3/versionId/9',
            );
            expect(link).toHaveAttribute('target', '_blank');
        });
    });

    it('shows the workflow version without a link to users who cannot see workflows', () => {
        mockUser.current = { permissions: [] };
        renderWithThemeAndIntlProvider(
            <FormVersionsWorkflowImpactsTable
                formId={7}
                workflowImpacts={workflowImpacts}
            />,
        );

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.getAllByText('Follow-ups (PUBLISHED)')).toHaveLength(2);
    });
});
