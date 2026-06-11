import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { EditAIApiKey } from './EditAIApiKeyModal';

describe('EditAIApiKeyModal test', () => {
    const renderComponent = (opened: boolean = true) =>
        renderWithThemeAndIntlProvider(
            <EditAIApiKey accountId={1} defaultOpen={opened} />,
        );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('validates accordingly to schema', async () => {
        renderComponent();

        const saveButton = screen.getByRole('button', {
            name: /save/i,
        });

        // Empty form should not be submittable
        expect(saveButton).toBeDisabled();

        const input = screen.getByLabelText('AI API key *');

        await act(async () => {
            await userEvent.type(input, 'invalid');
            await userEvent.tab();
        });

        expect(saveButton).toBeDisabled();
        expect(
            screen.getByText('16 characters', { exact: false }),
        ).toBeVisible();

        await act(async () => {
            await userEvent.clear(input);
            await userEvent.tab();
        });

        expect(saveButton).toBeDisabled();
        expect(
            screen.getByText('Invalid input', { exact: false }),
        ).toBeVisible();
    });
});
