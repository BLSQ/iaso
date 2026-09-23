import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { EntityCard } from './EntityCard';
import { makeEntity, makeEntityFields } from './testUtils';

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

describe('EntityCard a11y', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <EntityCard
                entity={makeEntity()}
                fields={makeEntityFields()}
                withLinkToEntity
            />,
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});
