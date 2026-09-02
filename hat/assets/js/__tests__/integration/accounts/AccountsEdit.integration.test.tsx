import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AccountFeatureFlagDropdown } from 'Iaso/api/accountFeatureFlags';
import {
    getAccountFeatureFlagsMock,
    getApiAccountFeatureFlagsDropdownListMockHandler,
} from 'Iaso/api/accountFeatureFlags/endpoints/account-feature-flags/account-feature-flags.msw';
import {
    getApiAccountsAiApiKeyRetrieveQueryKey,
    getApiAccountsMeRetrieveQueryKey,
} from 'Iaso/api/accounts';
import {
    getApiAccountsMeRetrieveMockHandler,
    getApiAccountsMeRetrieveResponseMock,
    getApiAccountsRetrieveMockHandler,
    getApiAccountsRetrieveResponseMock,
    getApiAccountsUpdateMockHandler,
} from 'Iaso/api/accounts/endpoints/account/account.msw';
import { ModuleDropdown } from 'Iaso/api/modules';
import { getApiModulesDropdownListMockHandler } from 'Iaso/api/modules/endpoints/modules/modules.msw';
import { baseUrls } from 'Iaso/constants/urls';
import { AccountsEdit } from 'Iaso/domains/accounts/edit';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../tests/helpers';

const mockUpdate = vi.fn();

const server = setupServer(
    ...[getApiAccountsRetrieveMockHandler()],
    ...getAccountFeatureFlagsMock(),
    ...[getApiModulesDropdownListMockHandler()],
    ...[
        getApiAccountsUpdateMockHandler(async info => {
            const body = await info.request.json();
            mockUpdate(info.params.id, body);
            return;
        }),
    ],
    ...[
        getApiAccountsMeRetrieveMockHandler(
            getApiAccountsMeRetrieveResponseMock({
                id: 1234,
                modules: [],
            }),
        ),
    ],
);

const invalidateSpy = vi.spyOn(TestingQueryClient, 'invalidateQueries');

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

const previousDefaults = TestingQueryClient.getDefaultOptions();

const { mockRedirectTo } = vi.hoisted(() => {
    return { mockRedirectTo: vi.fn() };
});

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useRedirectTo: () => mockRedirectTo,
        useRedirectToReplace: () => vi.fn(),
    };
});

describe('Accounts edit tests', () => {
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
        // mockCurrentUser.mockReturnValue({
        //     account: {
        //         id: 1234,
        //         modules: [],
        //     },
        // });
    });

    it('displays a 404 page if account is not found', async () => {
        server.use(
            getApiAccountsRetrieveMockHandler(() => {
                throw new HttpResponse(
                    { detail: 'Not found' },
                    { status: 404 },
                );
            }),
        );
        renderAccountEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText('404')).toBeVisible();
    });
    it('displays a loading spinner when loading', () => {
        vi.stubEnv('MSW_DELAY', '10000000');
        renderAccountEdit();
        expect(screen.getByRole('progressbar')).toBeVisible();
    });
    it('displays and submit initial data', async () => {
        const mockAccount = getApiAccountsRetrieveResponseMock({
            id: 1234,
            feature_flags: [{ code: 'ALLOW_SHAPE_EDITION', name: 'FF1' }],
            modules: ['COMPLETENESS_PER_PERIOD', 'DEFAULT'],
            user_manual_path: 'USER MANUAL PATH',
            forum_path: 'FORUM PATH',
        });
        const mockModules: ModuleDropdown[] = [
            { label: 'Default', value: 'DEFAULT' },
            {
                label: 'Completeness per Period',
                value: 'COMPLETENESS_PER_PERIOD',
            },
            { label: 'Data collection forms', value: 'DATA_COLLECTION_FORMS' },
        ];
        const feature_flags: AccountFeatureFlagDropdown[] = [
            { label: 'FF1', value: 'ALLOW_SHAPE_EDITION' },
            { label: 'FF2', value: 'ALLOW_CATCHMENT_EDITION' },
        ];
        server.use(
            getApiAccountsRetrieveMockHandler(mockAccount),
            getApiModulesDropdownListMockHandler(mockModules),
            getApiAccountFeatureFlagsDropdownListMockHandler(feature_flags),
        );

        renderAccountEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        await waitFor(() => {
            expect(
                screen.getByRole('textbox', { name: /name */i }),
            ).toHaveValue(mockAccount.name);
        });
        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /name */i }),
                'a',
            );
            await userEvent.tab();
        });

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: /save/i,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', { name: /save/i }),
            );
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
        });

        expect(mockUpdate).toHaveBeenCalledWith('1234', {
            enforce_password_validation:
                mockAccount.enforce_password_validation,
            feature_flags: ['ALLOW_SHAPE_EDITION'],
            forum_path: mockAccount.forum_path,
            modules: ['COMPLETENESS_PER_PERIOD', 'DEFAULT'],
            name: mockAccount.name + 'a',
            user_manual_path: mockAccount.user_manual_path,
        });

        expect(screen.getByLabelText(/name */i)).toHaveValue(
            mockAccount.name + 'a',
        );
        expect(screen.getByLabelText(/forum address/i)).toHaveValue(
            mockAccount.forum_path,
        );
        expect(screen.getByLabelText(/user manual address/i)).toHaveValue(
            mockAccount.user_manual_path,
        );
    });
    it('displays correctly backend errors', async () => {
        server.use(
            getApiAccountsUpdateMockHandler(async info => {
                mockUpdate(info);
                throw new HttpResponse(
                    JSON.stringify({
                        name: ['Name is wrong'],
                        forum_path: ['Forum path is wrong'],
                        user_manual_path: ['User manual path is wrong'],
                        enforce_password_validation: ['Wrong password'],
                        feature_flags: ['FF7 is not good'],
                        modules: ['Module is not good'],
                        non_field_errors: ['Account cannot be updated'],
                    }),
                    {
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
            }),
        );

        const mockAccount = getApiAccountsRetrieveResponseMock({
            id: 1234,
            feature_flags: [{ code: 'ALLOW_SHAPE_EDITION', name: 'FF1' }],
            modules: ['COMPLETENESS_PER_PERIOD', 'DEFAULT'],
            user_manual_path: 'USER MANUAL PATH',
            forum_path: 'FORUM PATH',
        });
        const mockModules: ModuleDropdown[] = [
            { label: 'Default', value: 'DEFAULT' },
            {
                label: 'Completeness per Period',
                value: 'COMPLETENESS_PER_PERIOD',
            },
            { label: 'Data collection forms', value: 'DATA_COLLECTION_FORMS' },
        ];
        const feature_flags: AccountFeatureFlagDropdown[] = [
            { label: 'FF1', value: 'ALLOW_SHAPE_EDITION' },
            { label: 'FF2', value: 'ALLOW_CATCHMENT_EDITION' },
        ];
        server.use(
            getApiAccountsRetrieveMockHandler(mockAccount),
            getApiModulesDropdownListMockHandler(mockModules),
            getApiAccountFeatureFlagsDropdownListMockHandler(feature_flags),
        );

        renderAccountEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        await act(async () => {
            await userEvent.type(
                screen.getByRole('textbox', { name: /name */i }),
                'a',
            );
            await userEvent.tab();
        });

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: /save/i,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', { name: /save/i }),
            );
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
        });

        expect(screen.getByText('Name is wrong')).toBeVisible();
        expect(screen.getByText('Forum path is wrong')).toBeVisible();
        expect(screen.getByText('User manual path is wrong')).toBeVisible();
        expect(screen.getByText('Wrong password')).toBeVisible();
        expect(screen.getByText('FF7 is not good')).toBeVisible();
        expect(screen.getByText('Module is not good')).toBeVisible();
        expect(screen.getByText('Account cannot be updated')).toBeVisible();
    });
    it('cannot call the api if form is invalid', async () => {
        renderAccountEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.clear(screen.getByLabelText(/name/i));
            await userEvent.tab();
        });

        await waitFor(() => {
            expect(
                screen.getByText('Invalid input', { exact: false }),
            ).toBeVisible();
        });

        expect(
            screen.getByRole('button', {
                name: /save/i,
            }),
        ).toBeDisabled();

        expect(mockUpdate).not.toHaveBeenCalled();
    });
    it('redirects to detail page when submit is valid and refreshes the client query key', async () => {
        const mockAccount = getApiAccountsRetrieveResponseMock({
            id: 1234,
            feature_flags: [],
            modules: [],
        });

        server.use(getApiAccountsRetrieveMockHandler(mockAccount));
        renderAccountEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.type(screen.getByLabelText(/name */i), 'New name');
        });

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: /save/i,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: /save/i,
                }),
            );
        });

        await waitFor(() => {
            expect(mockRedirectTo).toHaveBeenCalledWith(
                expect.stringContaining(baseUrls.accountsDetail),
            );
            expect(invalidateSpy).toHaveBeenCalledWith({
                queryKey: getApiAccountsMeRetrieveQueryKey(),
            });
        });
    });
    it('redirects to detail page without submitting when cancel button is clicked', async () => {
        const accountId = 12;
        renderAccountEdit(accountId);

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        const link = screen.getByRole('link', { name: /cancel/i });
        expect(link).toHaveAttribute(
            'href',
            `/${baseUrls.accountsDetail}/id/${accountId}/`,
        );
        await act(async () => {
            await userEvent.click(
                screen.getByRole('link', { name: /cancel/i }),
            );
        });

        expect(mockUpdate).not.toHaveBeenCalled();
    });
    it('disables submit while mutating', async () => {
        const mockAccount = getApiAccountsRetrieveResponseMock({
            id: 1234,
            feature_flags: [],
            modules: [],
        });

        server.use(
            getApiAccountsRetrieveMockHandler(mockAccount),
            getApiAccountsUpdateMockHandler(async () => {
                await new Promise(() => {}); // never resolves
            }),
        );
        renderAccountEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.type(screen.getByLabelText(/name */i), 'New name');
        });

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: /save/i,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: /save/i,
                }),
            );
        });

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: /save/i,
                }),
            ).toBeDisabled();
        });
    });
    it('refreshes the api key call if form_ai has been enabled', async () => {
        const mockAccount = getApiAccountsRetrieveResponseMock({
            id: 1234,
            feature_flags: [],
            modules: [],
        });

        const modules = [{ value: 'FORM_AI', label: 'Form AI' }];
        server.use(
            getApiAccountsRetrieveMockHandler(mockAccount),
            getApiModulesDropdownListMockHandler(modules as ModuleDropdown[]),
        );

        renderAccountEdit();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('checkbox', { name: /form ai */i }),
            );
        });

        await waitFor(() => {
            expect(
                screen.getByRole('button', {
                    name: /save/i,
                }),
            ).not.toBeDisabled();
        });

        await act(async () => {
            await userEvent.click(
                screen.getByRole('button', {
                    name: /save/i,
                }),
            );
        });

        await waitFor(() => {
            expect(mockRedirectTo).toHaveBeenCalledWith(
                expect.stringContaining(baseUrls.accountsDetail),
            );
            expect(invalidateSpy).toHaveBeenCalledWith({
                queryKey: getApiAccountsMeRetrieveQueryKey(),
            });
            expect(invalidateSpy).toHaveBeenCalledWith(
                getApiAccountsAiApiKeyRetrieveQueryKey(1234),
            );
        });
    });
});
