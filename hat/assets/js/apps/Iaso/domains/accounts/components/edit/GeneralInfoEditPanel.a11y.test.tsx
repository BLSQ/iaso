import React from 'react';
import { Formik } from 'formik';
import { axe } from 'jest-axe';
import { GeneralInfoEditPanel } from 'Iaso/domains/accounts/components/edit/GeneralInfoEditPanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('GeneralInfoEditPanel accessibility', () => {
    it('has no violation', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <Formik
                initialValues={{}}
                onSubmit={_values => {
                    return;
                }}
            >
                <GeneralInfoEditPanel />
            </Formik>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
