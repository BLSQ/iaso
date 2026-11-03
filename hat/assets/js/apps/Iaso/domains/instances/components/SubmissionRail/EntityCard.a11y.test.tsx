import React from 'react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { EntityCard } from './EntityCard';
import { makeEntity, makeEntityFields } from './testUtils';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string } | string) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? 'msg'),
        }),
    };
});

describe('EntityCard a11y', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <EntityCard
                    entity={makeEntity()}
                    fields={makeEntityFields()}
                    withLinkToEntity
                />
            </MemoryRouter>,
        );
        expect(await axe(container)).toHaveNoViolations();
    });
});
