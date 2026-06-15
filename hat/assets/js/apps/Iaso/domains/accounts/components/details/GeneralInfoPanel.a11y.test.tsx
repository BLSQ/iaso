import React from 'react';
import { faker } from '@faker-js/faker';
import { axe } from 'jest-axe';
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

describe('GeneralInfoPanel accessibility', () => {
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

    // todo: IconButton is not accessible ...
    it.skip('has no accessibility violation', async () => {
        const AIApiKey = getApiAccountsAiApiKeyRetrieveResponseMock({
            anthropic_api_key: faker.string.alphanumeric(32),
        });
        const { container } = renderComponent(undefined, AIApiKey);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
