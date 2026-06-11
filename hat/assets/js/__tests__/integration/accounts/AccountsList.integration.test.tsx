import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import {
    getApiAccountsListMockHandler,
    getApiAccountsListResponseMock,
} from 'Iaso/api/accounts/endpoints/account/account.msw';
import { convertToDate } from 'Iaso/components/Cells/DateTimeCell';
import { baseUrls } from 'Iaso/constants/urls';
import { Accounts } from 'Iaso/domains/accounts';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../tests/helpers';

const server = setupServer(getApiAccountsListMockHandler());

const previousDefaults = TestingQueryClient.getDefaultOptions();

describe('Accounts list tests', () => {
    beforeAll(() => {
        TestingQueryClient.setDefaultOptions({
            queries: {
                retry: false,
            },
        });
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
        TestingQueryClient.setDefaultOptions(previousDefaults);
    });
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    it('displays a loading spinner when loading', () => {
        vi.stubEnv('MSW_DELAY', '100000000');
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <Accounts />
            </MemoryRouter>,
        );

        expect(screen.getByRole('progressbar')).toBeVisible();
    });
    it('displays no results when there is no data', async () => {
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

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <Accounts />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText('No result')).toBeVisible();
    });
    it('displays data', async () => {
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

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <Accounts />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.queryByText('No result')).toBeNull();

        data?.results?.forEach(item => {
            expect(
                screen.getByRole('cell', { name: item.name }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole('cell', {
                    name: convertToDate(item.created_at),
                }),
            ).toBeInTheDocument();
        });
    });
    it('displays button to view details of account', async () => {
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

        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <Accounts />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.queryByText('No result')).toBeNull();

        const links = screen.queryAllByRole('link');
        const hrefs = links.map(link => link.getAttribute('href'));
        data?.results?.forEach(item => {
            expect(
                hrefs.some(
                    href =>
                        href === `/${baseUrls.accountsDetail}/id/${item.id}/`,
                ),
            ).toBeTruthy();
        });
    });
});
