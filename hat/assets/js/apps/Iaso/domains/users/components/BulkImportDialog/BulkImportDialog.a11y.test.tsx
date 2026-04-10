import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { IntlProvider } from 'react-intl';
import { BulkImportDialogModal } from 'Iaso/domains/users/components/BulkImportDialog/BulkImportDialog';
import { renderWithTheme } from '../../../../../../tests/helpers';

describe('BulkImportDialog accessibility', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithTheme(
            <IntlProvider locale={'en'} messages={{}}>
                <BulkImportDialogModal isOpen={true} closeDialog={() => {}} />
            </IntlProvider>,
        );
        const checkbox = screen.getByTestId('default-values-toggle');
        fireEvent.click(checkbox);
        expect(within(checkbox).getByRole('checkbox')).toBeChecked();

        await waitFor(() => {
            expect(screen.getByLabelText('Permissions')).toBeVisible();
            expect(screen.getByLabelText('User roles')).toBeVisible();
            expect(screen.getByLabelText('Projects')).toBeVisible();
            expect(screen.getByLabelText('Language')).toBeVisible();
            expect(screen.getByLabelText('Teams')).toBeVisible();
            expect(screen.getByLabelText('Organization')).toBeVisible();
            expect(
                screen.getByRole('button', {
                    name: /org units selected/i,
                }),
            ).toBeVisible();
        });

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
