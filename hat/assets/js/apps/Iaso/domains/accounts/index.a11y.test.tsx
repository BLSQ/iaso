import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import {
    getApiAccountsListMockHandler,
    getApiAccountsListResponseMock,
} from 'Iaso/api/accounts/endpoints/account/account.msw';
import { Accounts } from 'Iaso/domains/accounts';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../tests/helpers';

const server = setupServer(getApiAccountsListMockHandler());

describe('Accounts list accessibility', () => {
    beforeAll(() => {
        server.listen({
            onUnhandledRequest: 'error',
        });
        faker.seed(1);
    });

    afterEach(() => {
        server.resetHandlers();
        TestingQueryClient.clear();
    });

    afterAll(() => {
        server.close();
        faker.seed(Date.now());
    });
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    // todo : fix loadingspinner not being accessible
    it.skip('has no accessibility violation when loading', async () => {
        vi.stubEnv('MSW_DELAY', '100000000');

        const { container } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <Accounts />
            </MemoryRouter>,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    it.skip('has no accessibility violation when there is no data', async () => {
        const data = getApiAccountsListResponseMock({
            count: 0,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
            results: [],
        });
        server.use(getApiAccountsListMockHandler(data));

        const { container } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <Accounts />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText('No result')).toBeVisible();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    // todo : fix IconButton not being accessible
    it.skip('has no accessibility violation', async () => {
        const data = getApiAccountsListResponseMock({
            count: 2,
            has_next: false,
            has_previous: false,
            limit: 10,
            pages: 1,
            page: 1,
        });
        server.use(getApiAccountsListMockHandler(data));

        expect(data?.results?.length).toBeGreaterThan(0);

        const { container } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <Accounts />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.queryByText('No result')).toBeNull();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
