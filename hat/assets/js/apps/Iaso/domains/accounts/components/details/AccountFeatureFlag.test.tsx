import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, within } from '@testing-library/react';
import { getApiAccountFeatureFlagsDropdownListResponseMock } from 'Iaso/api/accountFeatureFlags/endpoints/account-feature-flags/account-feature-flags.msw';
import { getApiAccountsRetrieveResponseMock } from 'Iaso/api/accounts/endpoints/account/account.msw';
import { AccountFeatureFlagPanel } from 'Iaso/domains/accounts/components/details/AccountFeatureFlagPanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('AccountFeatureFlag tests', () => {
    beforeAll(() => {
        faker.seed(1);
    });

    afterAll(() => {
        faker.seed(Date.now());
    });
    it('renders an alert when no feature flags are provided', () => {
        const accountMock = getApiAccountsRetrieveResponseMock();

        renderWithThemeAndIntlProvider(
            <AccountFeatureFlagPanel
                accountId={1}
                accountFeatureFlags={[]}
                account={accountMock}
            />,
        );

        expect(screen.getByRole('alert')).toBeVisible();
    });

    it('renders a row for each feature flag', () => {
        const featureFlags =
            getApiAccountFeatureFlagsDropdownListResponseMock();
        expect(featureFlags?.length).toBeGreaterThan(0);
        const accountMock = getApiAccountsRetrieveResponseMock();

        renderWithThemeAndIntlProvider(
            <AccountFeatureFlagPanel
                accountId={1}
                accountFeatureFlags={featureFlags}
                account={accountMock}
            />,
        );

        const table = screen.getByRole('table');

        expect(within(table).queryAllByRole('row').length).toBe(
            featureFlags.length + 1,
        ); // counting table header
    });

    it('shows a selected icon for enabled feature flags', () => {
        const featureFlags =
            getApiAccountFeatureFlagsDropdownListResponseMock();
        expect(featureFlags?.length).toBeGreaterThan(0);
        const accountMock = getApiAccountsRetrieveResponseMock({
            feature_flags: [
                {
                    name: featureFlags?.[0]?.label,
                    code: featureFlags?.[0]?.value,
                },
            ],
        });

        renderWithThemeAndIntlProvider(
            <AccountFeatureFlagPanel
                accountId={1}
                accountFeatureFlags={featureFlags}
                account={accountMock}
            />,
        );

        const row = screen.getByText(featureFlags?.[0]?.label).closest('tr');

        expect(within(row!).getByLabelText('Selected')).toBeVisible();
    });

    it('shows a not selected icon for disabled feature flags', () => {
        const featureFlags =
            getApiAccountFeatureFlagsDropdownListResponseMock();
        expect(featureFlags?.length).toBeGreaterThan(0);
        const accountMock = getApiAccountsRetrieveResponseMock({
            feature_flags: [{ name: 'a', code: 'a' }],
        });

        renderWithThemeAndIntlProvider(
            <AccountFeatureFlagPanel
                accountId={1}
                accountFeatureFlags={featureFlags}
                account={accountMock}
            />,
        );

        const row = screen.getByText(featureFlags?.[0]?.label).closest('tr');

        expect(within(row!).getByLabelText('Not selected')).toBeVisible();
    });
});
