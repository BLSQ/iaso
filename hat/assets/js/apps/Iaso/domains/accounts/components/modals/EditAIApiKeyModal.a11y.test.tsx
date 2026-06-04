import React from 'react';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { EditAIApiKey } from 'Iaso/domains/accounts/components/modals/EditAIApiKeyModal';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';

describe('EditAIApiKeyModal accessibility', () => {
    // IconButton not accessible
    it.skip('does not have violations when not opened', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <EditAIApiKey accountId={1} defaultOpen={false} />,
        );
        expect(screen.queryByRole('dialog')).toBeNull();

        expect(await axe(container)).toHaveNoViolations();
    });

    it('does not have violations when opened', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <EditAIApiKey accountId={1} defaultOpen={true} />,
        );

        expect(await axe(container)).toHaveNoViolations();
    });
});
