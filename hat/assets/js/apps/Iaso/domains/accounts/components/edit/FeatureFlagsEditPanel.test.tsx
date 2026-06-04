import React from 'react';
import { screen } from '@testing-library/react';
import { FeatureFlagsEditPanel } from 'Iaso/domains/accounts/components/edit/FeatureFlagsEditPanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('FeatureFlagsEditPanel test', () => {
    it('displays an alert message when there is no feature flag', () => {
        renderWithThemeAndIntlProvider(
            <FeatureFlagsEditPanel accountFeatureFlags={[]} />,
        );
        expect(screen.getByRole('alert')).toBeVisible();
    });
});
