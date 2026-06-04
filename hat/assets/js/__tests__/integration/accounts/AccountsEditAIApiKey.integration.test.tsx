import React from 'react';
import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { vi } from 'vitest';
import {
    getApiAccountsAiApiKeyRetrieveMockHandler,
    getApiAccountsAiApiKeyUpdateMockHandler,
} from 'Iaso/api/accounts/endpoints/account/account.msw';
import { EditAIApiKey } from 'Iaso/domains/accounts/components/modals/EditAIApiKeyModal';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../tests/helpers';

const renderModal = (accountId: number = 1234) => {
    return renderWithThemeAndIntlProvider(
        <EditAIApiKey accountId={accountId} defaultOpen={true} />,
    );
};

const mockUpdate = vi.fn();
const key = faker.string.alphanumeric(18);
const server = setupServer(
    ...[
        getApiAccountsAiApiKeyRetrieveMockHandler({
            anthropic_api_key: faker.string.alphanumeric(12),
        }),
        getApiAccountsAiApiKeyUpdateMockHandler(async info => {
            const body = await info.request.json();
            mockUpdate(info.params.id, body);
            return;
        }),
    ],
);
const previousDefaults = TestingQueryClient.getDefaultOptions();

describe('EditAiApiKey integration test', () => {
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

    it('displays backend errors accordingly', async () => {
        server.use(
            getApiAccountsAiApiKeyUpdateMockHandler(async info => {
                mockUpdate(info);
                throw new HttpResponse(
                    JSON.stringify({
                        non_field_errors: ['Oops'],
                        anthropic_api_key: ['I prefer some other ai'],
                    }),
                    {
                        status: 400,
                    },
                );
            }),
        );

        renderModal();
        const passwordInput = screen.getByLabelText('AI API key *');

        await act(async () => {
            await userEvent.type(passwordInput, key);
        });

        const submitButton = screen.getByRole('button', { name: /save/i });
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
        await act(async () => {
            await userEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
            expect(screen.getByText('Oops')).toBeVisible();
            expect(screen.getByText('I prefer some other ai')).toBeVisible();
        });
    });
    it('calls the submit api with right data', async () => {
        renderModal();
        const passwordInput = screen.getByLabelText('AI API key *');

        await act(async () => {
            await userEvent.type(passwordInput, key);
        });

        const submitButton = screen.getByRole('button', { name: /save/i });
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
        await act(async () => {
            await userEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith('1234', {
                anthropic_api_key: key,
            });
        });
    });
    it('does not display initial data', () => {
        renderModal();
        expect(screen.queryByText(key)).toBeNull();
        const passwordInput = screen.getByLabelText('AI API key *');

        expect(passwordInput).toHaveValue('');
    });
    it('disables submission while the mutation is pending', async () => {
        server.use(
            getApiAccountsAiApiKeyUpdateMockHandler(async _info => {
                await new Promise(() => {}); // never resolves
            }),
        );

        renderModal();
        const passwordInput = screen.getByLabelText('AI API key *');

        await act(async () => {
            await userEvent.type(passwordInput, key);
        });

        const submitButton = screen.getByRole('button', { name: /save/i });
        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
        await act(async () => {
            await userEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(submitButton).toBeDisabled();
        });
    });
});
