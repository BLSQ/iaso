import React from 'react';
import { screen } from '@testing-library/react';
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
                        return acc
                            .replace(
                                /\{count, plural, one \{# file\} other \{# files\}\}/,
                                count === 1 ? '1 file' : `${count} files`,
                            )
                            .replace(/\{count[^}]*\}/g, String(value));
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
    InstanceValidationContent: () => (
        <div data-testid="validation-content">validation</div>
    ),
}));

vi.mock('../InstanceDetailsLocation', () => ({
    default: () => <div data-testid="location-content">location</div>,
}));

vi.mock('../InstancesFilesListComponent', () => ({
    default: () => <div data-testid="files-content">files</div>,
}));

vi.mock('../InstanceDetailsChangeRequests', () => ({
    default: () => <div data-testid="change-requests-content">changes</div>,
}));

vi.mock('../InstanceDetailsExportRequests', () => ({
    InstanceDetailsExportRequestsContent: () => (
        <div data-testid="export-requests-content">exports</div>
    ),
}));

vi.mock('../InstanceDetailsLocksHistory', () => ({
    InstanceDetailsLocksHistoryContent: () => (
        <div data-testid="locks-content">locks</div>
    ),
}));

describe('SubmissionRail', () => {
    it('renders the general card and core rail rows', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionRail
                currentInstance={makeInstance()}
                showHistoryLink={false}
                onLightBoxToggled={vi.fn()}
            />,
        );
        expect(screen.getByText('Location')).toBeInTheDocument();
        expect(screen.getByText('Kinshasa')).toBeInTheDocument();
        expect(screen.getByText('Validation')).toBeInTheDocument();
        expect(screen.getByText('Export requests')).toBeInTheDocument();
        expect(screen.getByText('None')).toBeInTheDocument();
        expect(screen.getByText('Locks')).toBeInTheDocument();
        expect(screen.getByText('Unlocked')).toBeInTheDocument();
        expect(screen.queryByText('Files')).not.toBeInTheDocument();
        expect(screen.queryByText('Change requests')).not.toBeInTheDocument();
    });

    it('shows the files row when the instance has files', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionRail
                currentInstance={makeInstance({
                    files: ['/a.jpg', '/b.jpg'],
                })}
                showHistoryLink={false}
                onLightBoxToggled={vi.fn()}
            />,
        );
        expect(screen.getByText('Files')).toBeInTheDocument();
        expect(screen.getByText('2 files')).toBeInTheDocument();
    });

    it('shows the change-requests row when present', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionRail
                currentInstance={makeInstance({
                    change_requests: [{ id: 1 }, { id: 2 }] as never,
                })}
                showHistoryLink={false}
                onLightBoxToggled={vi.fn()}
            />,
        );
        expect(screen.getByText('Change requests')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows locked state when the instance is locked', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionRail
                currentInstance={makeInstance({ is_locked: true })}
                showHistoryLink={false}
                onLightBoxToggled={vi.fn()}
            />,
        );
        expect(screen.getByText('Locked')).toBeInTheDocument();
    });
});
