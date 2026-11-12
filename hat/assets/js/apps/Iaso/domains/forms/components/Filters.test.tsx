import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { baseUrl } from '../config';
import MESSAGES from '../messages';
import { Filters } from './Filters';

const mockRedirectTo = vi.fn();

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useRedirectTo: () => mockRedirectTo,
    };
});

const renderFilters = (params = {}) =>
    renderWithThemeAndIntlProvider(
        <MemoryRouter>
            <Filters
                params={{
                    pageSize: '10',
                    order: '-updated_at',
                    page: '1',
                    orgUnitId: '1',
                    ...params,
                }}
            />
        </MemoryRouter>,
    );

describe('Filters', () => {
    beforeEach(() => {
        mockRedirectTo.mockClear();
    });

    it('should render the show only deleted checkbox in the drawer', async () => {
        renderFilters();
        await userEvent.click(screen.getByText('No active filter'));
        await waitFor(() => {
            expect(
                screen.getByRole('checkbox', {
                    name: MESSAGES.onlyDeleted.defaultMessage,
                }),
            ).toBeInTheDocument();
        });
    });

    it('should show active filters as chips in the bar', async () => {
        renderFilters({ search: 'hello' });
        await waitFor(() => {
            expect(screen.getByText('Search: hello')).toBeInTheDocument();
            expect(screen.getByText('Active filters')).toBeInTheDocument();
        });
    });

    it('resets page to 1 when applying filters', async () => {
        const user = userEvent.setup();
        renderFilters({ page: '3', search: 'hello' });

        await user.click(screen.getByText('Active filters'));
        const searchInput = await screen.findByDisplayValue('hello');
        await user.clear(searchInput);
        await user.type(searchInput, 'reset-page');
        await user.click(screen.getByRole('button', { name: /apply/i }));

        await waitFor(() => {
            expect(mockRedirectTo).toHaveBeenCalledWith(
                baseUrl,
                expect.objectContaining({
                    page: '1',
                    search: 'reset-page',
                }),
            );
        });
    });
});
