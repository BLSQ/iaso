import React from 'react';
import { screen, within } from '@testing-library/react';
import { getApiAccountsRetrieveResponseMock } from 'Iaso/api/accounts/endpoints/account/account.msw';
import { ModulePanel } from 'Iaso/domains/accounts/components/details/ModulePanel';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import MESSAGES from '../../messages';

describe('ModulePanel tests', () => {
    it('renders an alert when no modules are provided', () => {
        const accountMock = getApiAccountsRetrieveResponseMock();

        renderWithThemeAndIntlProvider(
            <ModulePanel accountId={1} modules={[]} account={accountMock} />,
        );

        expect(screen.getByRole('alert')).toBeVisible();
    });

    it('renders a row for each module', () => {
        const accountMock = getApiAccountsRetrieveResponseMock();

        const modulesMock = [
            { label: 'A', value: 'A' },
            { label: 'B', value: 'B' },
        ];
        renderWithThemeAndIntlProvider(
            <ModulePanel
                accountId={1}
                modules={modulesMock}
                account={accountMock}
            />,
        );
        const table = screen.getByRole('table');

        expect(within(table).queryAllByRole('row').length).toBe(
            modulesMock.length + 1,
        ); // counting table header
    });

    it('shows a selected icon for enabled modules', () => {
        const accountMock = getApiAccountsRetrieveResponseMock({
            modules: ['DEFAULT', 'COMPLETENESS_PER_PERIOD'],
        });

        const modulesMock = [
            { label: 'DEFAULT', value: 'DEFAULT' },
            { label: 'B', value: 'B' },
        ];
        renderWithThemeAndIntlProvider(
            <ModulePanel
                accountId={1}
                modules={modulesMock}
                account={accountMock}
            />,
        );

        const row = screen.getByText('DEFAULT').closest('tr');

        expect(within(row!).getByLabelText('Selected')).toBeVisible();
    });

    it('shows a not selected icon for disabled modules', () => {
        const accountMock = getApiAccountsRetrieveResponseMock({
            modules: ['DEFAULT', 'COMPLETENESS_PER_PERIOD'],
        });

        const modulesMock = [
            { label: 'DEFAULT', value: 'DEFAULT' },
            { label: 'B', value: 'B' },
        ];
        renderWithThemeAndIntlProvider(
            <ModulePanel
                accountId={1}
                modules={modulesMock}
                account={accountMock}
            />,
        );

        const row = screen.getByText('B').closest('tr');

        expect(within(row!).getByLabelText('Not selected')).toBeVisible();
    });

    it('shows FORM_AI tooltip', async () => {
        const accountMock = getApiAccountsRetrieveResponseMock({
            modules: ['FORM_AI'],
        });
        const modulesMock = [{ label: 'FORM_AI', value: 'FORM_AI' }];
        renderWithThemeAndIntlProvider(
            <ModulePanel
                accountId={1}
                modules={modulesMock}
                account={accountMock}
            />,
        );

        expect(
            screen.getByLabelText(
                MESSAGES.formAIModuleTooltipTitle.defaultMessage,
            ),
        ).toBeInTheDocument();
    });
});
