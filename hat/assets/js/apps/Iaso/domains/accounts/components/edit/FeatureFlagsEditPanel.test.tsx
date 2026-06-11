import React from 'react';
import { screen } from '@testing-library/react';
import { Formik, FormikHelpers } from 'formik';
import { FeatureFlagsEditPanel } from 'Iaso/domains/accounts/components/edit/FeatureFlagsEditPanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('FeatureFlagsEditPanel test', () => {
    it('displays default values when there is no feature flag', () => {
        renderWithThemeAndIntlProvider(
            <Formik
                initialValues={{
                    feature_flags: [
                        'First feature flag',
                        'Second feature flag',
                    ],
                }}
                onSubmit={function (
                    _values: { feature_flags: string[] },
                    _formikHelpers: FormikHelpers<{
                        feature_flags: string[];
                    }>,
                ): void | Promise<any> {
                    throw new Error('Function not implemented.');
                }}
            >
                <FeatureFlagsEditPanel accountFeatureFlags={[]} />
            </Formik>,
        );

        expect(
            screen.getByRole('checkbox', { name: 'First feature flag' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('checkbox', { name: 'First feature flag' }),
        ).toBeChecked();

        expect(
            screen.getByRole('checkbox', { name: 'Second feature flag' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('checkbox', { name: 'Second feature flag' }),
        ).toBeChecked();
    });
});
