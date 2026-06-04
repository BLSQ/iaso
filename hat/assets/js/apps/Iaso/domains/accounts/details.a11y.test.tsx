import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { delay, http, HttpResponse, type RequestHandlerOptions } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { getAccountFeatureFlagsMock } from 'Iaso/api/accountFeatureFlags/endpoints/account-feature-flags/account-feature-flags.msw';
import { getAccountMock } from 'Iaso/api/accounts/endpoints/account/account.msw';
import { baseUrls } from 'Iaso/constants/urls';
import AccountsDetails from 'Iaso/domains/accounts/details';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../tests/helpers';

// todo : remove this once modules api and user api is switched to orval

const { mockUserHasAccessToModule } = vi.hoisted(() => {
    return { mockUserHasAccessToModule: vi.fn() };
});

vi.mock('Iaso/domains/users/utils', async () => {
    const actual = await vi.importActual('Iaso/domains/users/utils');
    return {
        ...actual,
        userHasAccessToModule: mockUserHasAccessToModule,
    };
});

export const getApiModuleListMockHandler = (
    overrideResponse?: Array<{ label: string; value: string }>,
    options?: RequestHandlerOptions,
) => {
    return http.get(
        '*/api/modules/',
        async (_info: Parameters<Parameters<typeof http.get>[1]>[0]) => {
            await delay(
                (() =>
                    process.env?.MSW_DELAY
                        ? parseInt(process.env.MSW_DELAY)
                        : 0)(),
            );

            return HttpResponse.json(
                overrideResponse !== undefined ? overrideResponse : [],
                { status: 200 },
            );
        },
        options,
    );
};

const server = setupServer(
    ...getAccountMock(),
    ...getAccountFeatureFlagsMock(),
    ...[getApiModuleListMockHandler()],
);

const renderAccountDetail = (id: number = 1234) => {
    return renderWithThemeAndIntlProvider(
        <MemoryRouter
            initialEntries={[
                `/${baseUrls.accountsDetail}/accountId/1/id/${id}/`,
            ]}
        >
            <Routes>
                <Route
                    path={`/${baseUrls.accountsDetail}/*`}
                    element={<AccountsDetails />}
                ></Route>
            </Routes>
        </MemoryRouter>,
    );
};

const previousDefaults = TestingQueryClient.getDefaultOptions();

describe('Account detail accessibility', () => {
    beforeAll(() => {
        TestingQueryClient.setDefaultOptions({
            queries: {
                retry: false,
            },
        });
        faker.seed(1);
        server.listen({
            onUnhandledRequest: 'error',
        });
    });

    afterEach(() => {
        server.resetHandlers();
        TestingQueryClient.clear();
    });

    afterAll(() => {
        faker.seed(Date.now());
        server.close();
        TestingQueryClient.setDefaultOptions(previousDefaults);
    });

    // todo: loading spinner not accessible
    it.skip('has no accessibility violation when loading', async () => {
        vi.stubEnv('MSW_DELAY', '10000000');
        const { container } = renderAccountDetail();
        expect(screen.getByRole('progressbar')).toBeVisible();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    it('has no accessibility violation with data', async () => {
        const { container } = renderAccountDetail();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
