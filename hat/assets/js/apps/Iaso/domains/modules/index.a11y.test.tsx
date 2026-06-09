import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import {
    getApiModulesListMockHandler,
    getApiModulesListResponseMock,
    getModulesMock,
} from 'Iaso/api/modules/endpoints/modules/modules.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { Modules } from 'Iaso/domains/modules/index';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../tests/helpers';

const server = setupServer(...getModulesMock());

const previousDefaults = TestingQueryClient.getDefaultOptions();

const renderList = () => {
    return renderWithThemeAndIntlProvider(
        <MemoryRouter initialEntries={[`/${baseUrls.modules}/accountId/1/`]}>
            <Routes>
                <Route
                    path={`/${baseUrls.modules}/*`}
                    element={<Modules />}
                ></Route>
            </Routes>
        </MemoryRouter>,
    );
};

describe('Modules list accessibility', () => {
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
        vi.clearAllMocks();
    });
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    // todo : SearchInput in bluesquare has violations
    it.skip('has no accessibility violation', async () => {
        const data = getApiModulesListResponseMock();
        expect(data?.length).toBeGreaterThan(0);
        expect(
            data?.filter(d => d.is_activated_for_user)?.length,
        ).toBeGreaterThan(0);
        expect(
            data?.filter(d => !d.is_activated_for_user)?.length,
        ).toBeGreaterThan(0);
        server.use(getApiModulesListMockHandler(data));

        const { container } = renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
