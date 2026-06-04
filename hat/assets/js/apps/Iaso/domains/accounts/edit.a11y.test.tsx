import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { delay, http, HttpResponse, RequestHandlerOptions } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import {
    getAccountFeatureFlagsMock,
    getApiAccountFeatureFlagsDropdownListMockHandler,
} from 'Iaso/api/accountFeatureFlags/endpoints/account-feature-flags/account-feature-flags.msw';
import {
    getApiAccountsRetrieveMockHandler,
    getApiAccountsRetrieveResponseMock,
    getApiAccountsUpdateMockHandler,
} from 'Iaso/api/accounts/endpoints/account/account.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { AccountsEdit } from 'Iaso/domains/accounts/edit';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../tests/helpers';

const renderAccountEdit = (id: number = 1234) => {
    return renderWithThemeAndIntlProvider(
        <MemoryRouter
            initialEntries={[`/${baseUrls.accountsEdit}/accountId/1/id/${id}/`]}
        >
            <Routes>
                <Route
                    path={`/${baseUrls.accountsEdit}/*`}
                    element={<AccountsEdit />}
                ></Route>
            </Routes>
        </MemoryRouter>,
    );
};

export const getApiModuleListMockHandler = (
    overrideResponse?: { results: Array<{ codename: string }> },
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

const mockUpdate = vi.fn();

const server = setupServer(
    ...[getApiAccountsRetrieveMockHandler()],
    ...getAccountFeatureFlagsMock(),
    ...[getApiModuleListMockHandler()],
    ...[
        getApiAccountsUpdateMockHandler(async info => {
            const body = await info.request.json();
            mockUpdate(info.params.id, body);
            return;
        }),
    ],
);
const previousDefaults = TestingQueryClient.getDefaultOptions();

describe('AccountsEdit accessiblity', () => {
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
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    // todo : LoadingSpinner not accessible
    it.skip('has no accessibility violation when loading', async () => {
        vi.stubEnv('MSW_DELAY', '10000000');
        const { container } = renderAccountEdit();
        expect(screen.getByRole('progressbar')).toBeVisible();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations', async () => {
        const mockAccount = getApiAccountsRetrieveResponseMock({
            feature_flags: [{ code: 'FF1', name: 'FF1' }],
            modules: ['COMPLETENESS_PER_PERIOD', 'DEFAULT'],
            user_manual_path: 'USER MANUAL PATH',
            forum_path: 'FORUM PATH',
        });
        const mockModules = [
            { codename: 'DEFAULT' },
            { codename: 'COMPLETENESS_PER_PERIOD' },
            { codename: 'DATA_COLLECTION_FORMS' },
        ];
        const feature_flags = [
            { label: 'FF1', value: 'FF1' },
            { label: 'FF2', value: 'FF2' },
        ];
        server.use(
            getApiAccountsRetrieveMockHandler(mockAccount),
            getApiModuleListMockHandler({ results: mockModules }),
            getApiAccountFeatureFlagsDropdownListMockHandler(feature_flags),
        );

        const { container } = renderAccountEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
