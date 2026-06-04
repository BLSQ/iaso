import React from 'react';
import { screen } from '@testing-library/react';
import { ModulesEditPanel } from 'Iaso/domains/accounts/components/edit/ModulesEditPanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('ModulesEditPanel test', () => {
    it('displays an alert message when there are no modules', () => {
        renderWithThemeAndIntlProvider(<ModulesEditPanel modules={[]} />);
        expect(screen.getByRole('alert')).toBeVisible();
    });
});
