import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { BulkImportForm } from 'Iaso/domains/users/components/BulkImport/BulkImportForm';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('BulkImportDialog accessibility', () => {
    // multiple issues in blsq-components :/
    it.skip('has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <BulkImportForm cancelUrl={'/home'} />,
            </MemoryRouter>,
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
