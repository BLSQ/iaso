import React from 'react';

import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import {
    getApiAccountsAiApiKeyRetrieveResponseMock,
    getApiAccountsRetrieveResponseMock,
} from 'Iaso/api/accounts/endpoints/account/account.msw';
import { GeneralInfoPanel } from 'Iaso/domains/accounts/components/details/GeneralInfoPanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

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

describe('GeneralInfoPanel test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
        mockUserHasAccessToModule.mockReturnValue(true);
    });

    const renderComponent = (
        account = getApiAccountsRetrieveResponseMock(),
        AIApiKey = getApiAccountsAiApiKeyRetrieveResponseMock(),
    ) =>
        renderWithThemeAndIntlProvider(
            <GeneralInfoPanel
                accountId={1}
                account={account}
                AIApiKey={AIApiKey}
            />,
        );

    it('renders the Anthropic API key row when the user has access', () => {
        const AIApiKey = getApiAccountsAiApiKeyRetrieveResponseMock({
            anthropic_api_key: faker.string.alphanumeric(32),
        });
        renderComponent(undefined, AIApiKey);

        expect(screen.getByText(/anthropic/i)).toBeInTheDocument();

        expect(
            screen.getByText(AIApiKey.anthropic_api_key as string),
        ).toBeVisible();
    });
    it('does not render the Anthropic API key row when the user lacks access', () => {
        mockUserHasAccessToModule.mockReturnValue(false);
        const AIApiKey = getApiAccountsAiApiKeyRetrieveResponseMock({
            anthropic_api_key: faker.string.alphanumeric(32),
        });
        renderComponent(undefined, AIApiKey);

        expect(screen.queryByText(/anthropic/i)).not.toBeInTheDocument();
        expect(
            screen.queryByText(AIApiKey.anthropic_api_key as string),
        ).not.toBeInTheDocument();
    });
    it('renders a delete button when an API key exists', () => {
        const AIApiKey = getApiAccountsAiApiKeyRetrieveResponseMock({
            anthropic_api_key: faker.string.alphanumeric(32),
        });
        renderComponent(undefined, AIApiKey);

        expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();
    });
    it('does not render a delete button when no API key exists', () => {
        renderComponent(
            undefined,
            getApiAccountsAiApiKeyRetrieveResponseMock({
                anthropic_api_key: null,
            }),
        );

        expect(screen.queryByTestId('DeleteIcon')).not.toBeInTheDocument();
    });
    it('renders a success icon when strong password enforcement is enabled', () => {
        renderComponent(
            getApiAccountsRetrieveResponseMock({
                enforce_password_validation: true,
            }),
        );

        expect(screen.getByLabelText(/yes/i)).toBeInTheDocument();
    });
    it('renders an error icon when strong password enforcement is disabled', () => {
        renderComponent(
            getApiAccountsRetrieveResponseMock({
                enforce_password_validation: false,
            }),
        );

        expect(screen.getByLabelText(/no/i)).toBeInTheDocument();
    });
});
