import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SubmissionRail } from './SubmissionRail';
import { makeInstance } from './testUtils';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        LinkWithLocation: ({
            children,
            to,
            ...props
        }: {
            children: React.ReactNode;
            to: string;
        }) => (
            <a href={to} {...props}>
                {children}
            </a>
        ),
        useSafeIntl: () => ({
            formatMessage: (
                msg: { defaultMessage?: string } | string,
                values?: Record<string, unknown>,
            ) => {
                const text =
                    typeof msg === 'string'
                        ? msg
                        : (msg?.defaultMessage ?? 'msg');
                if (!values) return text;
                return Object.entries(values).reduce((acc, [key, value]) => {
                    if (key === 'count') {
                        const count = Number(value);
                        return acc.replace(
                            /\{count, plural, one \{# file\} other \{# files\}\}/,
                            count === 1 ? '1 file' : `${count} files`,
                        );
                    }
                    return acc.replace(
                        new RegExp(`\\{${key}[^}]*\\}`, 'g'),
                        String(value),
                    );
                }, text);
            },
        }),
    };
});

vi.mock('../ValidationWorkflow/InstanceValidationWidgetPaper', () => ({
    useValidationAvailability: () => 'available',
    InstanceValidationContent: () => <div>validation</div>,
}));

vi.mock('../InstanceDetailsLocation', () => ({
    default: () => <div>location</div>,
}));

vi.mock('../InstancesFilesListComponent', () => ({
    default: () => <div>files</div>,
}));

vi.mock('../InstanceDetailsChangeRequests', () => ({
    default: () => <div>changes</div>,
}));

vi.mock('../InstanceDetailsExportRequests', () => ({
    InstanceDetailsExportRequestsContent: () => <div>exports</div>,
}));

vi.mock('../InstanceDetailsLocksHistory', () => ({
    InstanceDetailsLocksHistoryContent: () => <div>locks</div>,
}));

describe('SubmissionRail a11y', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionRail
                currentInstance={makeInstance({
                    files: ['/a.jpg'],
                    change_requests: [{ id: 1 }] as never,
                    export_statuses: ['READY'],
                })}
                showHistoryLink
                onLightBoxToggled={vi.fn()}
            />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});
