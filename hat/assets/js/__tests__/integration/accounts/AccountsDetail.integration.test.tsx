import React, { act } from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import {
    getAccountFeatureFlagsMock,
    getApiAccountFeatureFlagsDropdownListMockHandler,
} from 'Iaso/api/accountFeatureFlags/endpoints/account-feature-flags/account-feature-flags.msw';
import {
    getAccountMock,
    getApiAccountsAiApiKeyDestroyMockHandler,
    getApiAccountsAiApiKeyRetrieveMockHandler,
    getApiAccountsAiApiKeyRetrieveResponseMock,
    getApiAccountsAiApiKeyUpdateMockHandler,
    getApiAccountsRetrieveMockHandler,
    getApiAccountsRetrieveResponseMock,
} from 'Iaso/api/accounts/endpoints/account/account.msw';
import { getApiModulesDropdownListMockHandler } from 'Iaso/api/modules/endpoints/modules/modules.msw';
import { baseUrls } from 'Iaso/constants/urls';
import AccountsDetails from 'Iaso/domains/accounts/details';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../tests/helpers';

// todo : remove this once user api is switched to orval

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

const server = setupServer(
    ...getAccountMock(),
    ...getAccountFeatureFlagsMock(),
    ...[getApiModulesDropdownListMockHandler()],
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

describe('Account detail integration test', () => {
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
        mockUserHasAccessToModule.mockReturnValue(true);
    });
    it('renders loading spinner when loading', () => {
        vi.stubEnv('MSW_DELAY', '10000000');
        renderAccountDetail();
        expect(screen.getByRole('progressbar')).toBeVisible();
    });

    it('renders 404 if API returns nothing', async () => {
        server.use(
            getApiAccountsRetrieveMockHandler(() => {
                throw new HttpResponse(
                    { detail: 'Not found' },
                    { status: 404 },
                );
            }),
        );
        renderAccountDetail();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByText('404')).toBeVisible();
    });
    it('renders data', async () => {
        faker.seed(5);
        const data = getApiAccountsAiApiKeyRetrieveResponseMock();
        expect(data.anthropic_api_key).not.toBeNull();

        const dataAccount = getApiAccountsRetrieveResponseMock({
            forum_path: 'Forum path user',
            user_manual_path: 'User account manual path',
            modules: ['DEFAULT', 'COMPLETENESS_PER_PERIOD'],
            feature_flags: [{ name: 'Hello', code: 'ALLOW_SHAPE_EDITION' }],
            enforce_password_validation: true,
        });
        server.use(
            getApiAccountsRetrieveMockHandler(dataAccount),
            getApiAccountsAiApiKeyRetrieveMockHandler(data),
            getApiAccountFeatureFlagsDropdownListMockHandler([
                { label: 'Hello', value: 'ALLOW_SHAPE_EDITION' },
            ]),
            getApiModulesDropdownListMockHandler([
                { label: 'Default', value: 'DEFAULT' },
            ]),
        );
        renderAccountDetail();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        // # renders some general data
        expect(screen.getByText(dataAccount.name)).toBeVisible();
        expect(
            screen.getByText(dataAccount.forum_path as string),
        ).toBeVisible();
        expect(
            screen.getByText(dataAccount.user_manual_path as string),
        ).toBeVisible();
        expect(
            within(screen.getByTestId('accounts-general')).getByLabelText(
                'Yes',
            ),
        ).toBeVisible();

        // # renders anthropic api key
        expect(
            screen.getByText(data.anthropic_api_key as string),
        ).toBeVisible();

        // renders module data
        expect(screen.getByText('Default')).toBeVisible();
        expect(
            within(screen.getByTestId('account-module-panel')).getByLabelText(
                'Selected',
            ),
        ).toBeVisible();

        // renders feature flag data
        expect(screen.getByText('Hello')).toBeVisible();
        expect(
            within(screen.getByTestId('account-feature-flags')).getByLabelText(
                'Selected',
            ),
        ).toBeVisible();
    });
    it('does not call the retrieve AI API key query if user has not access to module', async () => {
        mockUserHasAccessToModule.mockReturnValue(false);
        faker.seed(5);
        const data = getApiAccountsAiApiKeyRetrieveResponseMock();
        expect(data.anthropic_api_key).not.toBeNull();
        const mockRetrieve = vi.fn();

        server.use(
            getApiAccountsAiApiKeyRetrieveMockHandler(async info => {
                mockRetrieve(info.params.id);
                return data;
            }),
        );
        renderAccountDetail();

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });
        expect(screen.queryByText(data.anthropic_api_key as string)).toBeNull();

        expect(mockRetrieve).not.toHaveBeenCalled();
    });
    it('allows editing AI API key', async () => {
        faker.seed(5);
        const data = getApiAccountsAiApiKeyRetrieveResponseMock();
        expect(data.anthropic_api_key).not.toBeNull();

        const mockUpdate = vi.fn();
        const mockRetrieve = vi.fn();

        server.use(
            ...[
                getApiAccountsAiApiKeyRetrieveMockHandler(async info => {
                    mockRetrieve(info.params.id);
                    return data;
                }),
                getApiAccountsAiApiKeyUpdateMockHandler(async info => {
                    const body = await info.request.json();
                    mockUpdate(info.params.id, body);
                    return;
                }),
            ],
        );

        renderAccountDetail();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(
            within(screen.getByTestId('accounts-general')).getByTestId(
                'SettingsIcon',
            ),
        ).toBeVisible();

        const usrEvent = userEvent.setup();
        act(() => {
            usrEvent.click(
                within(screen.getByTestId('accounts-general')).getByTestId(
                    'SettingsIcon',
                ),
            );
        });

        expect(mockRetrieve).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeVisible();
        });

        const aiKeyValue = faker.string.alphanumeric(20);
        await act(async () => {
            await usrEvent.type(
                screen.getByLabelText('AI API key *'),
                aiKeyValue,
            );
            await usrEvent.click(
                within(screen.getByRole('dialog')).getByRole('button', {
                    name: 'Save',
                }),
            );
        });

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).toBeNull();
            expect(mockUpdate).toHaveBeenCalledWith('1234', {
                anthropic_api_key: aiKeyValue,
            });
        });

        // check it triggers the call again so it refreshes
        expect(mockRetrieve).toHaveBeenCalledTimes(2);
    });
    it('allows deleting AI API key', async () => {
        faker.seed(5);
        const data = getApiAccountsAiApiKeyRetrieveResponseMock();
        expect(data.anthropic_api_key).not.toBeNull();

        const mockDestroy = vi.fn();
        const mockRetrieve = vi.fn();

        server.use(
            ...[
                getApiAccountsAiApiKeyRetrieveMockHandler(async info => {
                    mockRetrieve(info.params.id);
                    return data;
                }),
                getApiAccountsAiApiKeyDestroyMockHandler(async info => {
                    mockDestroy(info.params.id);
                    return;
                }),
            ],
        );

        renderAccountDetail();
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(
            within(screen.getByTestId('accounts-general')).getByTestId(
                'DeleteIcon',
            ),
        ).toBeVisible();

        const usrEvent = userEvent.setup();
        act(() => {
            usrEvent.click(
                within(screen.getByTestId('accounts-general')).getByTestId(
                    'DeleteIcon',
                ),
            );
        });

        expect(mockRetrieve).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeVisible();
        });

        act(() => {
            usrEvent.click(
                within(screen.getByRole('dialog')).getByRole('button', {
                    name: 'Yes',
                }),
            );
        });

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).toBeNull();
            expect(mockDestroy).toHaveBeenCalledWith('1234');
        });

        // check it triggers the call again so it refreshes
        expect(mockRetrieve).toHaveBeenCalledTimes(2);
    });
    it('renders an edit button', async () => {
        const data = getApiAccountsRetrieveResponseMock();
        server.use(getApiAccountsRetrieveMockHandler(data));

        renderWithThemeAndIntlProvider(
            <MemoryRouter
                initialEntries={[
                    `/${baseUrls.accountsDetail}/accountId/1/id/${data.id}/`,
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
        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
            'href',
            `/${baseUrls.accountsEdit}/id/${data.id}/`,
        );
    });
});
