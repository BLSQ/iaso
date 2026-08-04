import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { GeneralCard } from './GeneralCard';
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
                return Object.entries(values).reduce(
                    (acc, [key, value]) =>
                        acc.replace(
                            new RegExp(`\\{${key}[^}]*\\}`, 'g'),
                            String(value),
                        ),
                    text,
                );
            },
        }),
    };
});

describe('GeneralCard', () => {
    it('renders form, period and reference/status chips', () => {
        renderWithThemeAndIntlProvider(
            <GeneralCard
                currentInstance={makeInstance({
                    form_name: 'Facility survey',
                    period: '2024Q1',
                    status: 'READY',
                    is_reference_instance: true,
                })}
                showHistoryLink={false}
            />,
        );
        expect(screen.getByText('Form')).toBeInTheDocument();
        expect(screen.getByText('Facility survey')).toBeInTheDocument();
        expect(screen.getByText('Period')).toBeInTheDocument();
        expect(screen.getByText('Reference')).toBeInTheDocument();
        expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('shows the history link when requested', () => {
        renderWithThemeAndIntlProvider(
            <GeneralCard
                currentInstance={makeInstance({ id: 42 })}
                showHistoryLink
            />,
        );
        expect(
            screen.getByRole('link', { name: 'See all versions' }),
        ).toHaveAttribute('href', expect.stringContaining('/instanceIds/42'));
    });

    it('toggles technical details', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(
            <GeneralCard
                currentInstance={makeInstance({ uuid: 'abc-123' })}
                showHistoryLink={false}
            />,
        );

        expect(screen.queryByText('Uuid')).not.toBeInTheDocument();
        await user.click(
            screen.getByRole('button', { name: /Technical details/ }),
        );
        expect(screen.getByText('Uuid')).toBeInTheDocument();
        expect(screen.getByText('abc-123')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Download XML/ }),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: /Technical details/ }),
        );
        await waitFor(() => {
            expect(screen.queryByText('Uuid')).not.toBeInTheDocument();
        });
    });
});
