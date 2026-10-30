import React from 'react';
import { screen } from '@testing-library/react';
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

describe('EntityCard', () => {
    it('renders the entity type and fields', () => {
        renderWithThemeAndIntlProvider(
            <EntityCard entity={makeEntity()} fields={makeEntityFields()} />,
        );
        expect(screen.getByText('Beneficiary')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Patient Zero')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('shows a link to the entity when requested', () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <EntityCard
                    entity={makeEntity({ id: 9 })}
                    fields={makeEntityFields()}
                    withLinkToEntity
                />
            </MemoryRouter>,
        );
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute(
            'href',
            expect.stringContaining('/entityId/9'),
        );
    });

    it('hides the entity link by default', () => {
        renderWithThemeAndIntlProvider(
            <EntityCard entity={makeEntity()} fields={makeEntityFields()} />,
        );
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
});
