import React from 'react';
import { screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { getApiAccountsRetrieveResponseMock } from 'Iaso/api/accounts/endpoints/account/account.msw';
import { ModulePanel } from 'Iaso/domains/accounts/components/details/ModulePanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('Module panel accessibility', () => {
    it("does not have accessiblity violations when there's no module", async () => {
        const accountMock = getApiAccountsRetrieveResponseMock();

        const { container } = renderWithThemeAndIntlProvider(
            <ModulePanel accountId={1} modules={[]} account={accountMock} />,
        );
        expect(screen.getByRole('alert')).toBeVisible();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    it('does not have accessiblity violations when there are modules', async () => {
        const accountMock = getApiAccountsRetrieveResponseMock({
            modules: ['DEFAULT', 'COMPLETENESS_PER_PERIOD'],
        });

        const modulesMock = [
            { label: 'DEFAULT', value: 'DEFAULT' },
            { label: 'B', value: 'B' },
        ];
        const { container } = renderWithThemeAndIntlProvider(
            <ModulePanel
                accountId={1}
                modules={modulesMock}
                account={accountMock}
            />,
        );

        let row = screen.getByText('DEFAULT').closest('tr');

        expect(within(row!).getByLabelText('Selected')).toBeVisible();

        row = screen.getByText('B').closest('tr');

        expect(within(row!).getByLabelText('Not selected')).toBeVisible();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
