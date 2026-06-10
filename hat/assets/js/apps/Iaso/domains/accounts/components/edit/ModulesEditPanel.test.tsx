import React from 'react';
import { screen } from '@testing-library/react';
import { Formik, FormikHelpers } from 'formik';
import { ModulesEditPanel } from 'Iaso/domains/accounts/components/edit/ModulesEditPanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('ModulesEditPanel test', () => {
    it('displays default values when there are no modules', () => {
        renderWithThemeAndIntlProvider(
            <Formik
                initialValues={{ modules: ['module 1', 'module 2'] }}
                onSubmit={function (
                    _values: { modules: string[] },
                    _formikHelpers: FormikHelpers<{
                        modules: string[];
                    }>,
                ): void | Promise<any> {
                    throw new Error('Function not implemented.');
                }}
            >
                <ModulesEditPanel modules={[]} />
            </Formik>,
        );
        expect(
            screen.getByRole('checkbox', { name: 'module 1' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('checkbox', { name: 'module 1' }),
        ).toBeChecked();

        expect(
            screen.getByRole('checkbox', { name: 'module 2' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('checkbox', { name: 'module 2' }),
        ).toBeChecked();
    });
});
