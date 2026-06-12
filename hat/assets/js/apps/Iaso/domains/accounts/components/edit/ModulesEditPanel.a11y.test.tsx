import React from 'react';
import { Formik } from 'formik';
import { axe } from 'jest-axe';
import { ModulesEditPanel } from 'Iaso/domains/accounts/components/edit/ModulesEditPanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('ModulesEditPanel accessibility test', () => {
    it('has no accessibility violation when there is no data', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <Formik
                initialValues={{}}
                onSubmit={_values => {
                    return;
                }}
            >
                <ModulesEditPanel modules={[]} />
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
                <ModulesEditPanel modules={[{ label: 'a', value: 'a' }]} />
            </Formik>,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
