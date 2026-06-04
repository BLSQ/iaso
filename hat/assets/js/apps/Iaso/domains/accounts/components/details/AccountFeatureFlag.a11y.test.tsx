import React from 'react';
import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { getApiAccountFeatureFlagsDropdownListResponseMock } from 'Iaso/api/accountFeatureFlags/endpoints/account-feature-flags/account-feature-flags.msw';
import { getApiAccountsRetrieveResponseMock } from 'Iaso/api/accounts/endpoints/account/account.msw';
import { AccountFeatureFlagPanel } from 'Iaso/domains/accounts/components/details/AccountFeatureFlagPanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('FeatureFlag accessibility', () => {
    beforeAll(() => {
        faker.seed(1);
    });

    afterAll(() => {
        faker.seed(Date.now());
    });

    it("does not have accessiblity violations when there's no feature flag", async () => {
        const accountMock = getApiAccountsRetrieveResponseMock();

        const { container } = renderWithThemeAndIntlProvider(
            <AccountFeatureFlagPanel
                accountId={1}
                accountFeatureFlags={[]}
                account={accountMock}
            />,
        );

        expect(screen.getByRole('alert')).toBeVisible();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    it('does not have accessiblity violations when there are feature flags', async () => {
        const featureFlags =
            getApiAccountFeatureFlagsDropdownListResponseMock();
        expect(featureFlags?.length).toBeGreaterThan(1);
        const accountMock = getApiAccountsRetrieveResponseMock({
            feature_flags: [
                {
                    name: featureFlags?.[0]?.label,
                    code: featureFlags?.[0]?.value,
                },
                {
                    name: 'b',
                    code: 'b',
                },
            ],
        });

        const { container } = renderWithThemeAndIntlProvider(
            <AccountFeatureFlagPanel
                accountId={1}
                accountFeatureFlags={featureFlags}
                account={accountMock}
            />,
        );

        expect(screen.queryByLabelText('Selected')).not.toBeNull();
        expect(screen.queryByLabelText('Not selected')).not.toBeNull();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
