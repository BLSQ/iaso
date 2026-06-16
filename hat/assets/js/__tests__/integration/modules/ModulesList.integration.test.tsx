import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import moment from 'moment';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ApiModulesListParams } from 'Iaso/api/modules';
import {
    getApiModulesListMockHandler,
    getApiModulesListResponseMock,
    getModulesMock,
} from 'Iaso/api/modules/endpoints/modules/modules.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { Modules } from 'Iaso/domains/modules';
import MESSAGES from 'Iaso/domains/modules/messages';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../tests/helpers';

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

describe('Module list integration', () => {
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

    it('renders a loading spinner while loading', () => {
        vi.stubEnv('MSW_DELAY', '1000000');
        renderList();
        expect(screen.getByRole('progressbar')).toBeVisible();
    });

    it('displays data', async () => {
        const data = getApiModulesListResponseMock();
        expect(data?.length).toBeGreaterThan(0);
        expect(
            data?.filter(d => d.is_activated_for_user)?.length,
        ).toBeGreaterThan(0);
        expect(
            data?.filter(d => !d.is_activated_for_user)?.length,
        ).toBeGreaterThan(0);
        server.use(getApiModulesListMockHandler(data));

        renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        data.forEach(({ name }) => {
            expect(screen.getByText(name)).toBeVisible();
        });

        expect(
            screen.queryAllByLabelText(MESSAGES.activated.defaultMessage)
                .length,
        ).toBe(data?.filter(d => d.is_activated_for_user)?.length);
        expect(
            screen.queryAllByLabelText(MESSAGES.notActivated.defaultMessage)
                .length,
        ).toBe(data?.filter(d => !d.is_activated_for_user)?.length);
    });

    it("displays no results when there's no data", async () => {
        server.use(getApiModulesListMockHandler([]));

        renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText(/no result/i, { exact: false })).toBeVisible();
    });

    it('uses the correct parameters for searching', async () => {
        const mockList = vi.fn();
        server.use(
            getApiModulesListMockHandler(async _info => {
                mockList(_info);
                return getApiModulesListResponseMock();
            }),
        );

        renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /search/i }),
                'something',
            );
        });
        const searchButton = screen.getByRole('button', { name: /search/i });
        await waitFor(() => {
            expect(searchButton).not.toBeDisabled();
        });
        await act(async () => {
            await userEvent.click(searchButton);
        });

        await waitFor(() => {
            expect(mockList).toHaveBeenCalledTimes(2);
        });

        const lastCall = mockList.mock.lastCall?.[0];

        const url = new URL(lastCall.request.url);

        expect(url.searchParams.get('search')).toBe('something');
        const params = Object.fromEntries(url.searchParams.entries());

        expect(() => ApiModulesListParams.parse(params)).not.toThrow();
    });

    it('rerenders and call modules list again when switching locale', async () => {
        const mockList = vi.fn();
        server.use(
            getApiModulesListMockHandler(async _info => {
                mockList(_info);
                return getApiModulesListResponseMock();
            }),
        );

        const { rerender } = renderList();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        await waitFor(() => {
            expect(mockList).toHaveBeenCalledTimes(1);
        });

        moment.locale('fr');
        rerender(
            <MemoryRouter
                initialEntries={[`/${baseUrls.modules}/accountId/1/`]}
            >
                <Routes>
                    <Route
                        path={`/${baseUrls.modules}/*`}
                        element={<Modules />}
                    />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await waitFor(() => {
            expect(mockList).toHaveBeenCalledTimes(2);
        });
    });
});
