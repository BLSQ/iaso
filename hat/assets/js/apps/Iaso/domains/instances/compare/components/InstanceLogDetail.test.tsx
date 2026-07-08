import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import MESSAGES from '../messages';
import { InstanceLogDetail } from './InstanceLogDetail';

vi.mock('./InstanceLogContentBasic', () => ({
    InstanceLogContentBasic: () => (
        <div data-testid="instance-log-content-basic">Table</div>
    ),
}));

vi.mock('../../../../components/papers/ErrorPaperComponent', () => ({
    default: ({ message }: { message: string }) => (
        <div role="alert">{message}</div>
    ),
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string; id?: string }) =>
                msg.defaultMessage ?? msg.id ?? '',
        }),
    };
});

describe('InstanceLogDetail', () => {
    const sampleContent = {
        logA: { json: { field: 'old' } },
        logB: { json: { field: 'new' } },
        logAFiles: {},
        logBFiles: {},
        formDescriptorA: [],
        formDescriptorB: [],
        fields: [{ name: 'field' }],
    };

    it('shows loading spinner when loading', () => {
        renderWithThemeAndIntlProvider(
            <InstanceLogDetail
                instanceLogContent={null}
                isLogDetailLoading
                isLogDetailError={false}
            />,
        );

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows error paper when error', () => {
        renderWithThemeAndIntlProvider(
            <InstanceLogDetail
                instanceLogContent={null}
                isLogDetailLoading={false}
                isLogDetailError
            />,
        );

        expect(screen.getByRole('alert')).toHaveTextContent(
            MESSAGES.errorLog.defaultMessage,
        );
    });

    it('renders table when content is present', () => {
        renderWithThemeAndIntlProvider(
            <InstanceLogDetail
                instanceLogContent={sampleContent}
                isLogDetailLoading={false}
                isLogDetailError={false}
            />,
        );

        expect(
            screen.getByTestId('instance-log-content-basic'),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(MESSAGES.emptyLogContent.defaultMessage),
        ).not.toBeInTheDocument();
    });

    it('renders empty table shell with custom placeholder', () => {
        renderWithThemeAndIntlProvider(
            <InstanceLogDetail
                instanceLogContent={null}
                isLogDetailLoading={false}
                isLogDetailError={false}
                emptyPlaceholder={MESSAGES.selectVersionToCompare}
            />,
        );

        expect(
            screen.getByTestId('instance-log-content-basic'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(MESSAGES.selectVersionToCompare.defaultMessage),
        ).toBeInTheDocument();
    });

    it('uses default empty placeholder when content is missing', () => {
        renderWithThemeAndIntlProvider(
            <InstanceLogDetail
                instanceLogContent={null}
                isLogDetailLoading={false}
                isLogDetailError={false}
            />,
        );

        expect(
            screen.getByText(MESSAGES.emptyLogContent.defaultMessage),
        ).toBeInTheDocument();
    });
});
