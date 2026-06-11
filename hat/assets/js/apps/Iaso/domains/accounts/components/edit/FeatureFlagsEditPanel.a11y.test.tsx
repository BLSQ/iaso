import React from 'react';
import { Formik } from 'formik';
import { axe } from 'jest-axe';
import { FeatureFlagsEditPanel } from 'Iaso/domains/accounts/components/edit/FeatureFlagsEditPanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('FeatureFlagsEditPanel accessiblity test', () => {
    it('has no accessibility violation when there is no data', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <Formik
                initialValues={{}}
                onSubmit={_values => {
                    return;
                }}
            >
                <FeatureFlagsEditPanel accountFeatureFlags={[]} />
            </Formik>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    it('has no accessiblity violation when there is data', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <Formik
                initialValues={{}}
                onSubmit={_values => {
                    return;
                }}
            >
                <FeatureFlagsEditPanel
                    accountFeatureFlags={[{ label: 'a', value: 'a' }]}
                />
            </Formik>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
