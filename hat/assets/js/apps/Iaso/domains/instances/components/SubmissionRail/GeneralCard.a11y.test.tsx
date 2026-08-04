import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
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
            formatMessage: (msg: { defaultMessage?: string } | string) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? 'msg'),
        }),
    };
});

describe('GeneralCard a11y', () => {
    it('collapsed technical details has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <GeneralCard
                currentInstance={makeInstance()}
                showHistoryLink={false}
            />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });

    it('expanded technical details has no accessibility violations', async () => {
        const user = userEvent.setup();
        const { container } = renderWithThemeAndIntlProvider(
            <GeneralCard currentInstance={makeInstance()} showHistoryLink />,
        );
        await user.click(
            screen.getByRole('button', { name: /Technical details/ }),
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});
